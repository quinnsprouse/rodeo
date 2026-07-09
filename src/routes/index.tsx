import type { IconSvgElement } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Calligraph } from "calligraph";
import { LazyMotion, m } from "motion/react";
import { useState } from "react";

import {
  AiBookIcon,
  ArrowRight01Icon,
  Bug01Icon,
  CancelCircleIcon,
  Github01Icon,
  Icon,
  MagicWand01Icon,
  Shield01Icon,
  Target01Icon,
} from "@/components/icons";
import { TerminalDemo } from "@/components/terminal-demo";
import { Snippet } from "@/components/ui/snippet";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { resolveStarterStatus, validateStarterStatusInput } from "@/lib/starter-status";
import { cn } from "@/lib/utils";

type DemoSearch = {
  demo?: "crash" | "error";
};

function validateDemoSearch(search: Record<string, unknown>): DemoSearch {
  return search.demo === "error" || search.demo === "crash" ? { demo: search.demo } : {};
}

const getStarterStatus = createServerFn({ method: "GET" })
  .validator(validateStarterStatusInput)
  .handler(({ data }) => resolveStarterStatus(data));

async function loadStarterStatus(fail: boolean) {
  try {
    return await getStarterStatus({ data: { fail } });
  } catch (error) {
    return {
      state: "error" as const,
      message: error instanceof Error ? error.message : "The starter server function failed.",
    };
  }
}

export const Route = createFileRoute("/")({
  validateSearch: validateDemoSearch,
  loaderDeps: ({ search }) => ({ crash: search.demo === "crash", fail: search.demo === "error" }),
  loader: async ({ deps }) => {
    if (deps.crash) return await getStarterStatus({ data: { fail: true } });
    return await loadStarterStatus(deps.fail);
  },
  component: Home,
});

const rotatingWords = ["agents.", "humans.", "teams.", "you."];

// ease-out-quint — snappy entrance, settles naturally (Emil Kowalski's animation principles)
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const features: { icon: IconSvgElement; title: string; desc: string }[] = [
  {
    icon: CancelCircleIcon,
    title: "No useEffect",
    desc: "Banned via lint rule. Agents and developers use useMountEffect for mount-only sync\u2009\u2014\u2009no race conditions, no infinite loops, no implicit control flow.",
  },
  {
    icon: AiBookIcon,
    title: "Progressive agent docs",
    desc: "AGENTS.md stays a short entry point. Domain language, decisions, and detailed guidance load only when relevant\u2009\u2014\u2009keeping context windows small and agents focused.",
  },
  {
    icon: Shield01Icon,
    title: "Three-layer quality gate",
    desc: "Pre-commit checks staged files. Pre-push runs the cached check, build, dead-code, and Playwright graph. CI verifies the clean template journey too.",
  },
  {
    icon: Bug01Icon,
    title: "Zero-config linting",
    desc: "oxlint with ten plugins — react, jsx-a11y, unicorn, node, and more — plus React Doctor health scans. Type-aware, no setup needed.",
  },
  {
    icon: MagicWand01Icon,
    title: "Auto-format on every edit",
    desc: "Portable Edit Feedback formats supported files after every write and typechecks TypeScript edits. Import and Tailwind class sorting happen automatically.",
  },
  {
    icon: Target01Icon,
    title: "Dead code detection",
    desc: "Knip catches unused exports, dependencies, and files. One command to keep the codebase lean as it grows.",
  },
];

const loop: { when: string; what: string }[] = [
  {
    when: "on write",
    what: "Project-owned Claude hooks format every supported file and typecheck TypeScript edits. Mistakes surface in seconds, not at code review.",
  },
  {
    when: "on commit",
    what: "Staged files are formatted, linted type-aware, and scanned by React Doctor. Bad code never enters history.",
  },
  {
    when: "on push",
    what: "The cached graph runs format, lint, types, unit tests, build, dead-code analysis, then Playwright end-to-end. What lands on main is green.",
  },
];

const stack = [
  { name: "Vite+", href: "https://viteplus.dev" },
  { name: "TanStack Start", href: "https://tanstack.com/start" },
  { name: "React 19", href: "https://react.dev" },
  { name: "Tailwind v4", href: "https://tailwindcss.com" },
  { name: "shadcn/ui", href: "https://ui.shadcn.com" },
  { name: "Nitro", href: "https://nitro.build" },
];

function useRotatingWord(words: string[], intervalMs = 2000) {
  const [index, setIndex] = useState(0);

  useMountEffect(() => {
    let id: number;

    function start() {
      id = window.setInterval(() => {
        setIndex((prev) => (prev + 1) % words.length);
      }, intervalMs);
    }

    function handleVisibility() {
      window.clearInterval(id);
      if (!document.hidden) start();
    }

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  });

  return words[index];
}

function Home() {
  const starterStatus = Route.useLoaderData();
  const starterStatusFailed = starterStatus.state === "error";
  const prefersReducedMotion = usePrefersReducedMotion();
  const skip = prefersReducedMotion;
  const currentWord = useRotatingWord(rotatingWords, 2500);

  return (
    <LazyMotion features={() => import("motion/react").then((mod) => mod.domAnimation)}>
      <div className="bg-white selection:bg-[#863bff]/20">
        {/* Hero — fills viewport */}
        <section className="flex min-h-dvh flex-col justify-center px-6 sm:px-10">
          <div className="mx-auto w-full max-w-2xl">
            {/* Brand */}
            <m.div
              className="font-[Yellowtail] text-[clamp(6rem,20vw,8rem)] leading-none text-[#863bff]"
              initial={skip ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              Rodeo
            </m.div>

            {/* Tagline */}
            <m.h1
              className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.2] font-bold tracking-[-0.03em] text-foreground"
              initial={skip ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
            >
              Built for{" "}
              <Calligraph as="span" className="text-[#863bff]" animation="smooth" trend={1}>
                {currentWord}
              </Calligraph>
            </m.h1>

            {/* Description */}
            <m.p
              className="mt-3 max-w-md text-[15px] leading-[1.65] text-pretty text-muted-foreground"
              initial={skip ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: EASE_OUT }}
            >
              Agents move fast and break things. Rodeo catches it before it
              ships&#x2009;&#x2014;&#x2009;every edit formatted, every commit linted, every push
              tested end-to-end. Free and open source.
            </m.p>

            {/* Actions */}
            <m.div
              className="mt-10"
              initial={skip ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: EASE_OUT }}
            >
              <Snippet text="npx degit quinnsprouse/rodeo my-app" shimmer className="w-full" />

              <div className="mt-5 flex items-center gap-5">
                <a
                  href="https://github.com/quinnsprouse/rodeo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-[#863bff]"
                >
                  <Icon icon={Github01Icon} className="size-4" aria-hidden="true" />
                  GitHub
                  <Icon
                    icon={ArrowRight01Icon}
                    className="size-3 -translate-x-1 opacity-0 transition-[transform,opacity] duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </a>
                <a
                  href="https://viteplus.dev/guide/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Docs
                </a>
              </div>
            </m.div>
          </div>
        </section>

        {/* The feedback loop — terminal replay + how it works behind the scenes */}
        <section className="border-t border-border/40">
          <div className="mx-auto w-full max-w-2xl px-6 pt-20 pb-24 sm:px-10">
            <p className="mb-3 text-sm text-muted-foreground">The feedback loop</p>
            <h2 className="max-w-md text-xl leading-snug font-bold tracking-[-0.02em] text-foreground">
              Your agent gets caught before you do.
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-[1.65] text-pretty text-muted-foreground">
              Every mistake is caught by the layer closest to it, so feedback arrives while the
              agent still has context to fix it.
            </p>

            <TerminalDemo className="mt-10" />

            <div
              className="mt-8 grid gap-5 rounded-xl border border-border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              role={starterStatusFailed ? "alert" : "status"}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      starterStatusFailed ? "bg-amber-500" : "bg-emerald-500",
                    )}
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {starterStatusFailed ? "Handled server error" : "Live full-stack example"}
                  </h3>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-pretty text-muted-foreground">
                  {starterStatus.message}
                </p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">
                  route loader → server function → rendered result
                </p>
              </div>
              <Link
                to="/"
                search={starterStatusFailed ? {} : { demo: "error" }}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-[#863bff]"
              >
                {starterStatusFailed ? "Return to ready state" : "Preview the error path"}
                <Icon
                  icon={ArrowRight01Icon}
                  className="size-3 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="mt-12 space-y-8">
              {loop.map((step) => (
                <div key={step.when} className="grid gap-2 sm:grid-cols-[200px_1fr] sm:gap-8">
                  <p className="font-mono text-[13px] font-medium text-[#863bff]">{step.when}</p>
                  <p className="text-[13px] leading-[1.7] text-pretty text-muted-foreground">
                    {step.what}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — scroll to see */}
        <section className="border-t border-border/40">
          <div className="mx-auto w-full max-w-2xl px-6 pt-20 pb-24 sm:px-10">
            <p className="mb-12 text-sm text-muted-foreground">What ships out of the box</p>

            <div className="space-y-10">
              {features.map((f) => (
                <div key={f.title} className="grid gap-3 sm:grid-cols-[200px_1fr] sm:gap-8">
                  <div className="flex items-start gap-2.5">
                    <Icon
                      icon={f.icon}
                      className="mt-0.5 size-4 shrink-0 text-[#863bff]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                      {f.title}
                    </h2>
                  </div>
                  <p className="text-[13px] leading-[1.7] text-pretty text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40">
          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 px-6 py-6 sm:gap-x-5 sm:px-10">
            {stack.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.name}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
