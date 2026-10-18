import { NodeHtmlMarkdown } from "node-html-markdown";
import { parse } from "node-html-parser";

const leftOut = [
  "[aria-hidden='true']",
  "[data-markdown='skip']",
  "[hidden]",
  "svg",
  "script",
  "style",
  "template",
  "noscript",
].join(", ");

export function pagePathForMarkdown(pathname: string) {
  if (pathname === "/index.md") return "/";
  return pathname.endsWith(".md") ? pathname.slice(0, -".md".length) : undefined;
}

function quality(accept: string, mediaType: string) {
  for (const range of accept.split(",")) {
    const [type = "", ...params] = range.split(";").map((part) => part.trim().toLowerCase());
    if (type !== mediaType) continue;
    const weight = params.find((param) => param.startsWith("q="));
    return weight ? Number(weight.slice(2)) : 1;
  }
  return 0;
}

export function prefersMarkdown(accept: string | null) {
  if (!accept) return false;
  const markdown = quality(accept, "text/markdown");
  return markdown > 0 && markdown >= quality(accept, "text/html");
}

export function htmlToMarkdown(html: string, pageUrl: string) {
  const root = parse(html);
  const content = root.querySelector("main") ?? root;
  for (const node of content.querySelectorAll(leftOut)) node.remove();
  for (const link of content.querySelectorAll("a[href]")) {
    link.setAttribute("href", new URL(link.getAttribute("href") ?? "", pageUrl).toString());
  }
  return NodeHtmlMarkdown.translate(content.innerHTML);
}
