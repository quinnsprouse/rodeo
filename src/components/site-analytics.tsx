import { rootRouteId, useLocation, useMatches } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";

export function SiteAnalytics() {
  const path = useLocation({ select: (location) => location.pathname });
  const route = useMatches({
    select: (matches) => {
      const page = matches.at(-1);
      return page && page.routeId !== rootRouteId ? page.fullPath : null;
    },
  });

  return <Analytics path={path} route={route} />;
}
