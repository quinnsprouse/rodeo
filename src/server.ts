import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { absoluteUrl } from "@/config/site";
import { htmlToMarkdown, pagePathForMarkdown, prefersMarkdown } from "@/lib/page-markdown.server";
import { siteOrigin } from "@/lib/site-files";

function trailingSlashRedirect(url: URL) {
  if (url.pathname === "/" || !url.pathname.endsWith("/")) return undefined;
  const pathname = url.pathname.replace(/\/+$/, "").replace(/^\/+/, "/") || "/";
  return new Response(null, { status: 308, headers: { location: `${pathname}${url.search}` } });
}

function isHtml(response: Response) {
  return response.headers.get("content-type")?.startsWith("text/html") ?? false;
}

async function markdownPage(request: Request, url: URL, pagePath: string) {
  const headers = new Headers(request.headers);
  headers.set("accept", "text/html");
  const page = await handler.fetch(
    new Request(new URL(`${pagePath}${url.search}`, url), { headers }),
  );
  if (!isHtml(page)) return page;

  const canonical = absoluteUrl(pagePath, siteOrigin(request));
  const markdown = htmlToMarkdown(await page.text(), canonical);
  const response = new Response(request.method === "HEAD" ? null : markdown, {
    status: page.status,
    headers: { "content-type": "text/markdown; charset=utf-8", vary: "accept" },
  });
  if (page.ok) response.headers.set("link", `<${canonical}>; rel="canonical"`);
  return response;
}

export default createServerEntry({
  async fetch(request) {
    const url = new URL(request.url);
    const redirect = trailingSlashRedirect(url);
    if (redirect) return redirect;
    if (request.method !== "GET" && request.method !== "HEAD") return handler.fetch(request);

    const pagePath =
      pagePathForMarkdown(url.pathname) ??
      (prefersMarkdown(request.headers.get("accept")) ? url.pathname : undefined);
    if (pagePath !== undefined) return markdownPage(request, url, pagePath);

    const response = await handler.fetch(request);
    if (!isHtml(response)) return response;
    const negotiated = new Response(response.body, response);
    negotiated.headers.append("vary", "accept");
    return negotiated;
  },
});
