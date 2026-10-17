import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { ArrowDown01Icon, Icon, PauseIcon, PlayIcon } from "@/components/icons";
import { OpinionsSection } from "@/components/opinions-section";
import { PageSection } from "@/components/page-section";
import { PyramidSection, pyramidSectionId } from "@/components/pyramid-section";
import { StartCta } from "@/components/start-cta";
import { BullSticker, TerminalSticker } from "@/components/stickers/hero";
import { SwapSentence } from "@/components/swap-sentence";
import { TerminalDemo } from "@/components/terminal-demo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Snippet } from "@/components/ui/snippet";
import { fonts, preloadFont } from "@/config/fonts";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ links: [preloadFont(fonts.bold), preloadFont(fonts.mono)] }),
  component: Home,
});

const installCommand = "npx degit quinnsprouse/rodeo my-app";

const checkpoints: { when: string; what: string }[] = [
  { when: "on edit", what: "Format, lint, and typecheck the file the agent just wrote." },
  { when: "end of turn", what: "Check every changed file and the tests that reach it." },
  { when: "on commit", what: "Check the staged files and the commit message." },
  { when: "on push", what: "Build the app, look for dead code, and run every browser test." },
  { when: "in CI", what: "Install the starter from scratch and run it all again." },
];

const stack = [
  { name: "Vite+", href: "https://viteplus.dev" },
  { name: "TanStack Start", href: "https://tanstack.com/start" },
  { name: "React 19", href: "https://react.dev" },
  { name: "Tailwind v4", href: "https://tailwindcss.com" },
  { name: "shadcn/ui", href: "https://ui.shadcn.com" },
  { name: "Nitro", href: "https://nitro.build" },
];

const heading = "font-brand text-l font-heavy text-foreground";
const lead = "mt-s max-w-[480px] text-muted-foreground";
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

function Hero({ paused }: { paused: boolean }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-m py-xl sm:px-xl">
      <h1 className="flex items-center gap-xxs font-brand text-logo font-heavy tracking-xs text-foreground">
        <BullSticker className="size-[1.4em]" />
        rodeo
      </h1>

      <div className="mt-l sm:mt-xl">
        <SwapSentence paused={paused} />
      </div>

      <Snippet
        text={installCommand}
        size="lg"
        leading={<TerminalSticker className="size-[2em]" />}
        shimmer
        className="mt-xl max-w-full sm:mt-xxl"
      />
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
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative flex min-h-svh flex-col pt-13 sm:pt-16">
      <Hero paused={paused} />
      <ScrollHint />
      {reducedMotion ? null : (
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? "Play the example sentence" : "Pause the example sentence"}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "absolute right-s bottom-m size-10 text-muted-foreground hover:text-foreground sm:right-l",
          )}
        >
          <Icon icon={paused ? PlayIcon : PauseIcon} className="size-4" aria-hidden="true" />
        </button>
      )}
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

        <PageSection>
          <h2 className={heading}>Checks run where the mistake happens.</h2>
          <p className={lead}>
            Fast checks run while the agent works. The full suite runs before anything leaves your
            machine.
          </p>

          <TerminalDemo className="mt-xl" />

          <dl className="mt-xl space-y-s">
            {checkpoints.map((step) => (
              <div key={step.when} className="grid gap-xxs sm:grid-cols-[160px_1fr] sm:gap-0">
                <dt className="font-data text-s text-foreground">{step.when}</dt>
                <dd className="text-muted-foreground">{step.what}</dd>
              </div>
            ))}
          </dl>
        </PageSection>

        <PageSection>
          <StartCta installCommand={installCommand} />
        </PageSection>
      </main>

      <footer className="px-l divider-t sm:px-xl">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-m gap-y-xxs py-l sm:gap-x-l">
          {stack.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="py-xs text-xs text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground"
            >
              {s.name}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
