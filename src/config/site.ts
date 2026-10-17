import { clientEnv } from "@/config/env";

interface PageMeta {
  title: string;
  description: string;
  image: { path: string; alt: string };
}

const homeMeta: PageMeta = {
  title: "Rodeo — Wrangle Your AI Agents",
  description:
    "An agent-ready React starter with guardrails for AI agents. Built on Vite+, TanStack Start, shadcn/ui, and Tailwind v4.",
  image: {
    path: "/og-home.png",
    alt: "The Rodeo bull logo above the line: checks every edit, catches stray comments, and keeps Claude Code on track.",
  },
};

export const philosophyMeta: PageMeta = {
  title: "Rodeo Philosophy",
  description:
    "How Rodeo thinks about building with agents, and why it drops code comments, unit tests, and long docs.",
  image: {
    path: "/og-rationale.png",
    alt: "Rodeo Philosophy, with coin, scissors, and bull stickers.",
  },
};

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
    const image = new URL(page.image.path, `${origin}/`).toString();
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
    { property: "og:site_name", content: "Rodeo" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  const links: Array<Record<string, string>> = [];

  if (origin && canonicalPath !== undefined) {
    const safePathname = new URL(canonicalPath, "https://placeholder.invalid").pathname;
    const canonical = new URL(safePathname, `${origin}/`).toString();
    meta.push({ property: "og:url", content: canonical });
    links.push({ rel: "canonical", href: canonical });
  }

  return { links, meta };
}
