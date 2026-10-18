import { createFileRoute } from "@tanstack/react-router";

import { siteOrigin, sitemapXml, textFile } from "@/lib/site-files";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => textFile(sitemapXml(siteOrigin(request)), "application/xml"),
    },
  },
});
