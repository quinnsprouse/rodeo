import type { Page } from "@/config/pages";
import { site } from "@/config/site";
import { website } from "@/lib/structured-data";

export const homePage: Page = {
  structuredData: ({ url, description, author }) => ({
    "@context": "https://schema.org",
    "@graph": [
      website({ url, description }),
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
