import { createFileRoute } from "@tanstack/react-router";

import { robotsTxt, siteOrigin, textFile } from "@/lib/site-files";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => textFile(robotsTxt(siteOrigin(request)), "text/plain"),
    },
  },
});
