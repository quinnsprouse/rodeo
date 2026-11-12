import {
  RouterServer,
  defineHandlerCallback,
  renderSsrHtmlResponse,
} from "@tanstack/react-router/ssr/server";
import { createStartHandler } from "@tanstack/react-start/server";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { createElement } from "react";
import { prerender } from "react-dom/static";

import { htmlToMarkdown, prefersMarkdown } from "@/lib/page-markdown.server";
import {
  absoluteUrl,
  markdownPath,
  normalizePath,
  pagePathForMarkdown,
  permanentRedirect,
  publicOrigin,
} from "@/lib/page-url";

function trailingSlashRedirect(url: URL) {
  if (url.pathname === "/" || !url.pathname.endsWith("/")) return undefined;
  return permanentRedirect(normalizePath(url.pathname), url);
}

function isHtml(response: Response) {
  return response.headers.get("content-type")?.startsWith("text/html") ?? false;
}

const inlineEveryBoundary = { progressiveChunkSize: Number.POSITIVE_INFINITY };

const renderFinishedPage = createStartHandler(
  defineHandlerCallback(({ request, router, responseHeaders }) =>
    renderSsrHtmlResponse({
      router,
      responseHeaders,
      render: async () => {
        const page = createElement(RouterServer, { router });
        const { prelude } = await prerender(page, {
          ...inlineEveryBoundary,
          signal: request.signal,
        });
        return new Response(prelude).text();
      },
    }),
  ),
);

function fetchPage(request: Request, url: URL, pagePath: string) {
  const headers = new Headers(request.headers);
  headers.set("accept", "text/html");
  return renderFinishedPage(new Request(new URL(`${pagePath}${url.search}`, url), { headers }));
}

function redirectToMarkdownTwin(page: Response, url: URL) {
  const location = page.headers.get("location");
  if (!location || page.status < 300 || page.status >= 400) return undefined;
  const target = new URL(location, url);
  if (target.origin !== url.origin) return undefined;
  return new Response(null, {
    status: page.status,
    headers: { location: `${markdownPath(target.pathname)}${target.search}` },
  });
}

async function markdownPage(request: Request, page: Response, pagePath: string) {
  if (!isHtml(page)) return page;

  const canonical = absoluteUrl(pagePath, publicOrigin(request));
  const markdown = htmlToMarkdown(await page.text(), canonical);
  const response = new Response(request.method === "HEAD" ? null : markdown, {
    status: page.status,
    headers: { "content-type": "text/markdown; charset=utf-8", vary: "accept" },
  });
  if (page.ok) response.headers.set("link", `<${canonical}>; rel="canonical"`);
  return response;
}

async function markdownTwin(request: Request, url: URL, pagePath: string) {
  const page = await fetchPage(request, url, pagePath);
  return redirectToMarkdownTwin(page, url) ?? markdownPage(request, page, pagePath);
}

export default createServerEntry({
  async fetch(request) {
    const url = new URL(request.url);
    const redirect = trailingSlashRedirect(url);
    if (redirect) return redirect;
    if (request.method !== "GET" && request.method !== "HEAD") return handler.fetch(request);

    const path = normalizePath(url.pathname);
    const twinOf = pagePathForMarkdown(path);
    if (twinOf !== undefined) return markdownTwin(request, url, twinOf);
    if (prefersMarkdown(request.headers.get("accept"))) {
      return markdownPage(request, await fetchPage(request, url, path), path);
    }

    const response = await handler.fetch(request);
    if (!isHtml(response)) return response;
    const negotiated = new Response(response.body, response);
    negotiated.headers.append("vary", "accept");
    return negotiated;
  },
});
