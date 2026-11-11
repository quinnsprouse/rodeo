import type { StaticDataRouteOption } from "@tanstack/react-router";

import { site } from "@/config/site";
import { pageMatch } from "@/lib/page-match";
import { absoluteUrl, markdownPath, normalizePath } from "@/lib/page-url";
import { author, structuredDataScript } from "@/lib/structured-data";

interface PageFacts {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  author: typeof author;
}

export interface Page {
  title?: string;
  description?: string;
  image?: { path: string; alt: string };
  structuredData?: (page: PageFacts) => object;
  listed?: false;
}

interface PageMatch {
  routeId: string;
  status: string;
  pathname: string;
  staticData: StaticDataRouteOption;
}

interface PageRoute {
  options: { component?: unknown; staticData?: StaticDataRouteOption };
}

type HeadTag = Record<string, string>;

export function currentPage<Match extends PageMatch>(matches: readonly Match[]) {
  const match = pageMatch(matches);
  return match?.status === "success" ? match : undefined;
}

function pageText(page: Page = {}) {
  return { title: page.title ?? site.title, description: page.description ?? site.description };
}

export function listedPages<Path extends string>({
  routesByPath,
}: {
  routesByPath: Record<Path, PageRoute>;
}) {
  return Object.entries<PageRoute>(routesByPath)
    .filter(
      ([path, { options }]) =>
        options.component !== undefined &&
        !path.includes("$") &&
        options.staticData?.page?.listed !== false,
    )
    .map(([path, { options }]) => {
      const { title, description } = pageText(options.staticData?.page);
      return { path, title, description };
    })
    .toSorted((first, second) => (first.path < second.path ? -1 : 1));
}

export type ListedPage = ReturnType<typeof listedPages>[number];

function textMeta({ title, description }: ReturnType<typeof pageText>): HeadTag[] {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

function imageMeta(imageUrl: string, alt: string): HeadTag[] {
  return [
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: alt },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: alt },
  ];
}

const siteMeta: HeadTag[] = [
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: site.name },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: `@${site.author.xHandle}` },
  { name: "twitter:creator", content: `@${site.author.xHandle}` },
];

export function pageHead(match: PageMatch | undefined, origin: string | undefined) {
  const page = match?.staticData.page ?? {};
  const text = pageText(page);
  if (!origin) return { meta: [...textMeta(text), ...siteMeta], links: [], scripts: [] };

  const image = page.image ?? site.image;
  const imageUrl = absoluteUrl(image.path, origin);
  const meta = [...textMeta(text), ...imageMeta(imageUrl, image.alt), ...siteMeta];
  if (!match) return { meta, links: [], scripts: [] };

  const path = normalizePath(match.pathname);
  const url = absoluteUrl(path, origin);
  return {
    meta: [...meta, { property: "og:url", content: url }],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", type: "text/markdown", href: absoluteUrl(markdownPath(path), origin) },
    ],
    scripts: page.structuredData
      ? [structuredDataScript(page.structuredData({ url, ...text, imageUrl, author }))]
      : [],
  };
}
