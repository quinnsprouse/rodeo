import { site } from "@/config/site";

export const author = {
  "@type": "Person",
  name: site.author.name,
  url: site.author.url,
  sameAs: [site.author.url, `https://x.com/${site.author.xHandle}`],
};

export function structuredDataScript(data: object) {
  return { type: "application/ld+json", children: JSON.stringify(data).replaceAll("<", "\\u003c") };
}
