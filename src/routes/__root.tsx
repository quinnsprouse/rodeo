/// <reference types="vite/client" />
import { Outlet, createRootRoute, HeadContent, Scripts, ScriptOnce } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { RouteErrorComponent } from "@/components/route-error";
import { RouteNotFoundComponent } from "@/components/route-not-found";
import { createSiteHead } from "@/config/site";

import appCss from "@/styles/app.css?url";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500&family=Yellowtail&display=swap";
export const Route = createRootRoute({
  head: () => {
    const siteHead = createSiteHead("/");

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#ffffff" },
        ...siteHead.meta,
      ],
      links: [
        ...siteHead.links,
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preload", href: GOOGLE_FONTS_URL, as: "style" },
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
        <ScriptOnce>
          {`var l=document.createElement('link');l.rel='stylesheet';l.href='${GOOGLE_FONTS_URL}';document.head.appendChild(l);`}
        </ScriptOnce>
        <a
          href="#main"
          className="fixed top-0 left-0 z-50 -translate-y-full bg-[#863bff] px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <main id="main">{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
