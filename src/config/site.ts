import { clientEnv } from "@/config/env";

interface PageMeta {
  path: string;
  title: string;
  description: string;
  image: { path: string; alt: string };
}

export const site = {
  name: "Rodeo",
  tagline: "A free React starter for Claude Code and Codex.",
  repository: "https://github.com/quinnsprouse/rodeo",
  installCommand: "npx degit quinnsprouse/rodeo my-app",
  author: {
    name: "Quinn Sprouse",
    url: "https://github.com/quinnsprouse",
    xHandle: "QuinnSprouse",
  },
};

export const homeMeta: PageMeta = {
  path: "/",
  title: "Rodeo — React starter for Claude Code and Codex",
  description:
    "An agent-ready React starter with guardrails for AI agents. Built on Vite+, TanStack Start, shadcn/ui, and Tailwind v4.",
  image: {
    path: "/og-home.png",
    alt: "The Rodeo logo: a purple bull sticker beside the word rodeo.",
  },
};

export const philosophyMeta = {
  path: "/rationale",
  title: "Rodeo Philosophy",
  description:
    "How Rodeo thinks about building with agents, and why it drops code comments, unit tests, and long docs.",
  image: {
    path: "/og-rationale.png",
    alt: "Rodeo Philosophy: how i think about building with agents, and why rodeo is different. With coin, scissors, and codebase stickers.",
  },
  published: "2026-10-17",
} satisfies PageMeta & { published: string };

export const sitePages: PageMeta[] = [homeMeta, philosophyMeta];

export function markdownPath(pathname: string) {
  return pathname === "/" ? "/index.md" : `${pathname}.md`;
}

export function absoluteUrl(path: string, origin: string) {
  return new URL(path, `${origin}/`).toString();
}

export function pageMeta(page: PageMeta, origin = clientEnv.VITE_APP_URL) {
  const meta: Array<Record<string, string>> = [
    { title: page.title },
    { name: "description", content: page.description },
    { property: "og:title", content: page.title },
    { property: "og:description", content: page.description },
    { name: "twitter:title", content: page.title },
    { name: "twitter:description", content: page.description },
  ];

  if (origin) {
    const image = absoluteUrl(page.image.path, origin);
    meta.push(
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: page.image.alt },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: page.image.alt },
    );
  }

  return meta;
}

export function createSiteHead(canonicalPath: string | undefined, origin = clientEnv.VITE_APP_URL) {
  const meta = [
    ...pageMeta(homeMeta, origin),
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.name },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: `@${site.author.xHandle}` },
    { name: "twitter:creator", content: `@${site.author.xHandle}` },
  ];
  const links: Array<Record<string, string>> = [];

  if (origin && canonicalPath !== undefined) {
    const safePathname = new URL(canonicalPath, "https://placeholder.invalid").pathname;
    const canonical = absoluteUrl(safePathname, origin);
    meta.push({ property: "og:url", content: canonical });
    links.push(
      { rel: "canonical", href: canonical },
      {
        rel: "alternate",
        type: "text/markdown",
        href: absoluteUrl(markdownPath(safePathname), origin),
      },
    );
  }

  return { links, meta };
}
