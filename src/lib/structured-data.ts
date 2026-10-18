import { absoluteUrl, homeMeta, philosophyMeta, site } from "@/config/site";

const author = {
  "@type": "Person",
  name: site.author.name,
  url: site.author.url,
  sameAs: [site.author.url, `https://x.com/${site.author.xHandle}`],
};

export function homeStructuredData(origin: string) {
  const url = absoluteUrl(homeMeta.path, origin);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: site.name,
        description: homeMeta.description,
      },
      {
        "@type": "SoftwareSourceCode",
        name: site.name,
        description: homeMeta.description,
        url,
        codeRepository: site.repository,
        programmingLanguage: "TypeScript",
        runtimePlatform: "Node.js",
        license: "https://opensource.org/license/mit",
        author,
      },
    ],
  };
}

export function philosophyStructuredData(origin: string) {
  const url = absoluteUrl(philosophyMeta.path, origin);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: philosophyMeta.title,
    description: philosophyMeta.description,
    url,
    mainEntityOfPage: url,
    image: absoluteUrl(philosophyMeta.image.path, origin),
    datePublished: philosophyMeta.published,
    author,
  };
}

export function structuredDataScript(data: object) {
  return { type: "application/ld+json", children: JSON.stringify(data).replaceAll("<", "\\u003c") };
}
