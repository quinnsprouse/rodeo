import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";

import { listedPages } from "@/config/pages";
import { publicOrigin } from "@/lib/page-url";
import { llmsTxt, textFile } from "@/lib/site-files";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async ({ request }): Promise<Response> =>
        textFile(
          llmsTxt(listedPages(await getRouterInstance()), publicOrigin(request)),
          "text/markdown",
        ),
    },
  },
});
