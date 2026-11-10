import type { ListedPage } from "@/config/pages";
import { site } from "@/config/site";
import { absoluteUrl, markdownPath } from "@/lib/page-url";

export function textFile(body: string, contentType: string) {
  return new Response(body, { headers: { "content-type": `${contentType}; charset=utf-8` } });
}

export function robotsTxt(origin: string) {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml", origin)}`,
    "",
  ].join("\n");
}

const xmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

function escapeXml(value: string) {
  return value.replaceAll(/[&<>"']/g, (character) => xmlEntities[character] ?? character);
}

export function sitemapXml(pages: ListedPage[], origin: string) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((page) => `  <url><loc>${escapeXml(absoluteUrl(page.path, origin))}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
}

export function llmsTxt(pages: ListedPage[], origin: string) {
  return [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    site.llms.details,
    "",
    "## Pages",
    "",
    ...pages.map(
      (page) =>
        `- [${page.title}](${absoluteUrl(markdownPath(page.path), origin)}): ${page.description}`,
    ),
    "",
    "## Source",
    "",
    ...site.llms.sourceLinks.map((link) => `- [${link.title}](${link.url}): ${link.description}`),
    "",
  ].join("\n");
}
