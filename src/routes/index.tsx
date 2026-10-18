import { createFileRoute, Link } from "@tanstack/react-router";

import { ChecksSection } from "@/components/checks-section";
import { ArrowDown01Icon, Icon } from "@/components/icons";
import { OpinionsSection } from "@/components/opinions-section";
import { PageSection } from "@/components/page-section";
import { PyramidSection, pyramidSectionId } from "@/components/pyramid-section";
import { StartCta } from "@/components/start-cta";
import { BullSticker, TerminalSticker } from "@/components/stickers/hero";
import { SwapSentence } from "@/components/swap-sentence";
import { ThemeToggle } from "@/components/theme-toggle";
import { Snippet } from "@/components/ui/snippet";
import { fonts, preloadFont } from "@/config/fonts";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ links: [preloadFont(fonts.bold), preloadFont(fonts.mono)] }),
  component: Home,
});

const installCommand = "npx degit quinnsprouse/rodeo my-app";

const stack = [
  { name: "Vite+", href: "https://viteplus.dev" },
  { name: "TanStack Start", href: "https://tanstack.com/start" },
  { name: "React 19", href: "https://react.dev" },
  { name: "Tailwind v4", href: "https://tailwindcss.com" },
  { name: "shadcn/ui", href: "https://ui.shadcn.com" },
  { name: "Nitro", href: "https://nitro.build" },
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
        <Link to="/rationale" className={navLink}>
          Philosophy
        </Link>
        <a
          href="https://github.com/quinnsprouse/rodeo"
          target="_blank"
          rel="noopener noreferrer"
          className={navLink}
        >
          GitHub
        </a>
        <ThemeToggle className="ml-xxs" />
      </nav>
    </div>
  );
}

function Hero() {
  return (
    <section className="@container flex flex-1 flex-col items-center justify-center px-m py-xl sm:px-xl">
      <h1 className="flex items-center gap-xxs font-brand text-logo font-heavy tracking-xs text-foreground">
        <BullSticker className="size-[1.4em]" />
        rodeo
      </h1>

      <div className="mt-l w-full sm:mt-xl">
        <SwapSentence />
      </div>

      <Snippet
        text={installCommand}
        size="lg"
        leading={<TerminalSticker className="size-[2em]" />}
        shimmer
        className="mt-xl max-w-full sm:mt-xxl"
      />

      <p className="mt-m text-center text-s text-muted-foreground sm:text-m">
        A free React starter for Claude Code and Codex.
      </p>
    </section>
  );
}

function ScrollHint() {
  const scrolled = useScrolledPast(24);

  return (
    <a
      href={`#${pyramidSectionId}`}
      aria-label="Scroll to how Rodeo works"
      className={cn(
        "mx-auto mb-m flex flex-col items-center gap-xxs px-m py-xs text-s text-muted-foreground transition duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground",
        scrolled && "invisible opacity-0",
      )}
    >
      Scroll
      <Icon
        icon={ArrowDown01Icon}
        className="size-4 motion-safe:animate-nudge"
        aria-hidden="true"
      />
    </a>
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
          <StartCta installCommand={installCommand} />
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
              <Link to="/rationale" className={footerLink}>
                Philosophy
              </Link>
              <a
                href="https://github.com/quinnsprouse/rodeo"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                GitHub
              </a>
            </nav>
          </div>
          <p className="text-xs text-muted-foreground">
            Made by{" "}
            <a
              href="https://github.com/quinnsprouse"
              target="_blank"
              rel="noopener noreferrer"
              className={inlineLink}
            >
              Quinn Sprouse
            </a>
            . Built on{" "}
            {stack.map((tool, index) => (
              <span key={tool.name}>
                <a
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={inlineLink}
                >
                  {tool.name}
                </a>
                {index < stack.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </footer>
    </div>
  );
}
