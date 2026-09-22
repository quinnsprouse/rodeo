import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { RouteErrorComponent } from "@/components/route-error";
import { RouteNotFoundComponent } from "@/components/route-not-found";
import { createSiteHead } from "@/config/site";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => {
    const siteHead = createSiteHead("/");

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        // Browser chrome matches --background in each theme (app.css).
        { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#ffffff" },
        { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#0a0a0a" },
        ...siteHead.meta,
      ],
      links: [
        ...siteHead.links,
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        {
          rel: "preload",
          href: "/fonts/Yellowtail-Regular.ttf",
          as: "font",
          type: "font/ttf",
          crossOrigin: "anonymous",
        },
        { rel: "stylesheet", href: appCss },
      ],
    };
  },
  component: RootComponent,
  shellComponent: RootShell,
  errorComponent: RouteErrorComponent,
  notFoundComponent: RouteNotFoundComponent,
});

function RootComponent() {
  return <Outlet />;
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
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
