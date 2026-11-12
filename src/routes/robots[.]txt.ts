import { createFileRoute } from "@tanstack/react-router";

import { publicOrigin } from "@/lib/page-url";
import { robotsTxt, textFile } from "@/lib/site-files";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => textFile(robotsTxt(publicOrigin(request)), "text/plain"),
    },
  },
});
