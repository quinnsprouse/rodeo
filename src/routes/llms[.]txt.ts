import { createFileRoute } from "@tanstack/react-router";

import { llmsTxt, siteOrigin, textFile } from "@/lib/site-files";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: ({ request }) => textFile(llmsTxt(siteOrigin(request)), "text/markdown"),
    },
  },
});
