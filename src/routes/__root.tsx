/// <reference types="vite/client" />
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  ScriptOnce,
  Link,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

import appCss from "@/styles/app.css?url";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500&family=Yellowtail&display=swap";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
      { title: "Rodeo — Wrangle Your AI Agents" },
      {
        name: "description",
        content:
          "An agent-ready React starter with guardrails for AI agents. Built on Vite+, TanStack Start, shadcn/ui, and Tailwind v4.",
      },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Rodeo — Wrangle Your AI Agents" },
      {
        property: "og:description",
        content:
          "An agent-ready React starter with guardrails for AI agents. Built on Vite+, TanStack Start, shadcn/ui, and Tailwind v4.",
      },
      { property: "og:image", content: "/og-image.png" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Rodeo — Wrangle Your AI Agents" },
      {
        name: "twitter:description",
        content:
          "An agent-ready React starter with guardrails for AI agents. Built on Vite+, TanStack Start, shadcn/ui, and Tailwind v4.",
      },
      { name: "twitter:image", content: "/og-image.png" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", href: GOOGLE_FONTS_URL, as: "style" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
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
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold text-balance">Page not found</h1>
        <p className="text-pretty text-muted-foreground">
          The page you are looking for either moved or does not exist.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  );
}
