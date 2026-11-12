import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";

import { listedPages } from "@/config/pages";
import { publicOrigin } from "@/lib/page-url";
import { sitemapXml, textFile } from "@/lib/site-files";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }): Promise<Response> =>
        textFile(
          sitemapXml(listedPages(await getRouterInstance()), publicOrigin(request)),
          "application/xml",
        ),
    },
  },
});
