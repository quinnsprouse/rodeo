import { createFileRoute, Link } from "@tanstack/react-router";

import { BullSticker } from "@/components/stickers/bull";
import { ThemeToggle } from "@/components/theme-toggle";
import { fonts, preloadFont } from "@/config/fonts";
import { site } from "@/config/site";
import { ExternalLink } from "@/demo/external-link";
import { ChecksSection } from "@/demo/landing/checks-section";
import { Hero } from "@/demo/landing/hero";
import { OpinionsSection } from "@/demo/landing/opinions-section";
import { homePage } from "@/demo/landing/page";
import { PageSection } from "@/demo/landing/page-section";
import { PyramidSection } from "@/demo/landing/pyramid-section";
import { ScrollHint } from "@/demo/landing/scroll-hint";
import { StartCta } from "@/demo/landing/start-cta";
import { links } from "@/demo/links";

export const Route = createFileRoute("/(demo)/")({
  staticData: { page: homePage },
  head: () => ({
    links: [preloadFont(fonts.bold), preloadFont(fonts.mono)],
  }),
  component: Home,
});

const stack = [
  { name: "Vite+", href: links.vitePlus },
  { name: "TanStack Start", href: links.tanstackStart },
  { name: "React 19", href: links.react },
  { name: "Tailwind v4", href: links.tailwind },
  { name: "shadcn/ui", href: links.shadcn },
  { name: "Nitro", href: links.nitro },
];

const footerLink =
  "text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground";
const inlineLink =
  "underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground hover:decoration-foreground";
const navLink =
  "inline-flex h-10 items-center rounded-s px-s text-s font-medium text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground";

function SiteNav() {
  return (
    <div className="px-l pt-s sm:px-xl sm:pt-l">
      <nav aria-label="Site" className="flex items-center justify-end">
        <Link to="/philosophy" className={navLink}>
          Philosophy
        </Link>
        <ExternalLink href={site.repository} className={navLink}>
          GitHub
        </ExternalLink>
        <ThemeToggle className="ml-xxs" />
      </nav>
    </div>
  );
}

function Intro() {
  return (
    <div className="flex min-h-svh flex-col pt-13 sm:pt-16">
      <Hero />
      <ScrollHint />
    </div>
  );
}

function Home() {
  return (
    <div className="relative bg-background selection:bg-primary-transparent">
      <header className="absolute inset-x-0 top-0 z-10">
        <SiteNav />
      </header>

      <main id="main">
        <Intro />

        <PyramidSection />

        <OpinionsSection />

        <ChecksSection />

        <PageSection>
          <StartCta />
        </PageSection>
      </main>

      <footer className="px-l divider-t sm:px-xl">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-m py-xl">
          <div className="flex flex-wrap items-center justify-between gap-m">
            <p className="flex items-center gap-xxs font-brand text-l font-heavy tracking-xs text-foreground">
              <BullSticker className="size-10" />
              rodeo
            </p>
            <nav aria-label="Footer" className="flex items-center gap-l text-s font-medium">
              <Link to="/philosophy" className={footerLink}>
                Philosophy
              </Link>
              <ExternalLink href={site.repository} className={footerLink}>
                GitHub
              </ExternalLink>
            </nav>
          </div>
          <p className="text-xs text-muted-foreground">
            Made by{" "}
            <ExternalLink href={site.author.url} className={inlineLink}>
              {site.author.name}
            </ExternalLink>
            . Built on{" "}
            {stack.map((tool, index) => (
              <span key={tool.name}>
                <ExternalLink href={tool.href} className={inlineLink}>
                  {tool.name}
                </ExternalLink>
                {index < stack.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </footer>
    </div>
  );
}
