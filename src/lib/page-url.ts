import { clientEnv } from "@/config/env";

const markdownExtension = ".md";
const homeMarkdownPath = `/index${markdownExtension}`;

export function normalizePath(pathname: string) {
  return `/${pathname.replaceAll(/^\/+|\/+$/g, "")}`;
}

export function markdownPath(path: string) {
  return path === "/" ? homeMarkdownPath : `${path}${markdownExtension}`;
}

export function pagePathForMarkdown(path: string) {
  if (path === homeMarkdownPath) return "/";
  return path.endsWith(markdownExtension) ? path.slice(0, -markdownExtension.length) : undefined;
}

export function absoluteUrl(path: string, origin: string) {
  return new URL(normalizePath(path), origin).toString();
}

export function permanentRedirect(path: string, from: URL) {
  return new Response(null, { status: 308, headers: { location: `${path}${from.search}` } });
}

export function publicOrigin(): string | undefined;
export function publicOrigin(request: Request): string;
export function publicOrigin(request?: Request) {
  return clientEnv.VITE_APP_URL ?? (request ? new URL(request.url).origin : undefined);
}
