import { clientEnv } from "@/config/env";
import { absoluteUrl, homeMeta, markdownPath, site, sitePages } from "@/config/site";

export function siteOrigin(request: Request) {
  return clientEnv.VITE_APP_URL ?? new URL(request.url).origin;
}

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

export function sitemapXml(origin: string) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitePages.map(
      (page) => `  <url><loc>${escapeXml(absoluteUrl(page.path, origin))}</loc></url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");
}

function rawSourceUrl(path: string) {
  return `${site.repository.replace("https://github.com/", "https://raw.githubusercontent.com/")}/main/${path}`;
}

export function llmsTxt(origin: string) {
  return [
    `# ${site.name}`,
    "",
    `> ${homeMeta.description}`,
    "",
    `${site.tagline} Start a project with \`${site.installCommand}\`, then point your agent at AGENTS.md. Each page below is also available as Markdown.`,
    "",
    "## Pages",
    "",
    ...sitePages.map(
      (page) =>
        `- [${page.title}](${absoluteUrl(markdownPath(page.path), origin)}): ${page.description}`,
    ),
    "",
    "## Source",
    "",
    `- [Repository](${site.repository}): the code behind this site`,
    `- [README](${rawSourceUrl("README.md")}): setup and scripts`,
    `- [AGENTS.md](${rawSourceUrl("AGENTS.md")}): the rules agents follow in this codebase, with links to the guides in docs/agents`,
    "",
  ].join("\n");
}
