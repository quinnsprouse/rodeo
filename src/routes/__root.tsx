import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  rootRouteId,
  useMatches,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { fonts, preloadFont } from "@/config/fonts";
import { createSiteHead } from "@/config/site";
import { useTheme } from "@/hooks/use-theme";
import { browserChrome, themeInitScript, type Canvas } from "@/lib/theme";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: ({ matches }) => {
    // why: With notFoundMode "root", TanStack Router matches an unknown URL only to the root route,
    // so a page whose deepest match is the root is a 404.
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
        { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        preloadFont(fonts.regular),
        preloadFont(fonts.medium),
        { rel: "stylesheet", href: appCss },
      ],
      scripts: [{ children: themeInitScript }],
    };
  },
  component: RootComponent,
  shellComponent: RootShell,
});

function RootComponent() {
  return <Outlet />;
}

function useCanvas(): Canvas {
  return (
    useMatches({
      select: (matches) => matches.findLast((match) => match.staticData.canvas)?.staticData.canvas,
    }) ?? "background"
  );
}

function BrowserChrome({ canvas }: { canvas: Canvas }) {
  const theme = useTheme();
  return <meta name="theme-color" content={browserChrome[theme][canvas]} />;
}

function RootShell({ children }: { children: ReactNode }) {
  const canvas = useCanvas();

  return (
    <html lang="en" className="motion-safe:scroll-smooth" suppressHydrationWarning>
      <head>
        <HeadContent />
        <BrowserChrome canvas={canvas} />
      </head>
      <body className={canvas === "card" ? "bg-card" : undefined}>
        <a
          href="#main"
          className="fixed top-0 left-0 z-50 -translate-y-full bg-foreground px-m py-xs text-s font-medium text-background transition-transform duration-(--motion-duration) ease-(--motion-easing) focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
