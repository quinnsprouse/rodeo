import { rootRouteId } from "@tanstack/react-router";

// why: With notFoundMode "root", TanStack Router matches an unknown URL only to the root route,
// so a page whose deepest match is the root is a 404.
export function pageMatch<Match extends { routeId: string }>(matches: readonly Match[]) {
  const match = matches.at(-1);
  return match?.routeId === rootRouteId ? undefined : match;
}
