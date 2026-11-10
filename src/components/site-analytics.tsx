import { useRouterState, type RouterState } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";

import { currentPage } from "@/config/pages";

function currentView({ matches, location }: RouterState) {
  const page = currentPage(matches);
  if (!page) return { route: location.pathname, path: location.pathname };
  return { route: page.fullPath, path: page.pathname };
}

export function SiteAnalytics() {
  const route = useRouterState({ select: (state) => currentView(state).route });
  const path = useRouterState({ select: (state) => currentView(state).path });

  return <Analytics path={path} route={route} />;
}
