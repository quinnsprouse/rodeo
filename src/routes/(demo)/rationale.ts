import { createFileRoute } from "@tanstack/react-router";

import { permanentRedirect } from "@/lib/page-url";

export const Route = createFileRoute("/(demo)/rationale")({
  server: {
    handlers: {
      ANY: ({ request }) => permanentRedirect("/philosophy", new URL(request.url)),
    },
  },
});
