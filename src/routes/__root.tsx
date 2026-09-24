import { Outlet, createRootRoute, HeadContent, Scripts, rootRouteId } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { createSiteHead } from "@/config/site";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: ({ matches }) => {
    // The deepest match is the rendered page. A 404 or failed page has no canonical URL. With
    // notFoundMode "root" (router.tsx), an unknown URL matches only the root route.
    const page = matches.at(-1);
    const hasOwnUrl = page?.status === "success" && page.routeId !== rootRouteId;
    const siteHead = createSiteHead(hasOwnUrl ? page.pathname : undefined);

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...siteHead.meta,
      ],
      links: [
        ...siteHead.links,
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "stylesheet", href: appCss },
      ],
    };
  },
  component: RootComponent,
  shellComponent: RootShell,
});

function RootComponent() {
  return <Outlet />;
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* HeadContent keeps one meta tag per name, so the per-theme pair lives here. Browser
            chrome matches --background in each theme (app.css). */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
      </head>
      <body>
        <a
          href="#main"
          className="fixed top-0 left-0 z-50 -translate-y-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <main id="main">{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
