import type { Page } from "@/config/pages";
import { site } from "@/config/site";

export const homePage: Page = {
  structuredData: ({ url, description, author }) => ({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${url}#website`, url, name: site.name, description },
      {
        "@type": "SoftwareSourceCode",
        name: site.name,
        description,
        url,
        codeRepository: site.repository,
        programmingLanguage: "TypeScript",
        runtimePlatform: "Node.js",
        license: "https://opensource.org/license/mit",
        author,
      },
    ],
  }),
};
