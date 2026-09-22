import { clientEnv } from "@/config/env";

const siteConfig = {
  name: "Rodeo",
  title: "Rodeo — Wrangle Your AI Agents",
  description:
    "An agent-ready React starter with guardrails for AI agents. Built on Vite+, TanStack Start, shadcn/ui, and Tailwind v4.",
  ogImagePath: "/og-image.png",
} as const;

export function createSiteHead(pathname: string, origin = clientEnv.VITE_APP_URL) {
  const meta: Array<Record<string, string>> = [
    { title: siteConfig.title },
    { name: "description", content: siteConfig.description },
    { property: "og:type", content: "website" },
    { property: "og:title", content: siteConfig.title },
    { property: "og:description", content: siteConfig.description },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: siteConfig.title },
    { name: "twitter:description", content: siteConfig.description },
  ];
  const links: Array<Record<string, string>> = [];

  if (origin) {
    const safePathname = new URL(pathname, "https://placeholder.invalid").pathname;
    const canonical = new URL(safePathname, `${origin}/`).toString();
    const image = new URL(siteConfig.ogImagePath, `${origin}/`).toString();
    meta.push(
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { name: "twitter:image", content: image },
    );
    links.push({ rel: "canonical", href: canonical });
  }

  return { links, meta };
}
