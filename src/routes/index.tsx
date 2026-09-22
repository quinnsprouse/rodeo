import type { IconSvgElement } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LazyMotion } from "motion/react";
import { z } from "zod";

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
import { RotatingWord } from "@/components/rotating-word";
import { TerminalDemo } from "@/components/terminal-demo";
import { Snippet } from "@/components/ui/snippet";
import { Wordmark } from "@/components/wordmark";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { resolveStarterStatus, starterStatusInputSchema } from "@/lib/starter-status";
import { cn } from "@/lib/utils";

// Search params are user input too. An unknown ?demo= value falls back to the normal page.
const demoSearchSchema = z.object({
  demo: z.enum(["crash", "error"]).optional().catch(undefined),
});

const getStarterStatus = createServerFn({ method: "GET" })
  .validator(starterStatusInputSchema)
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
  validateSearch: demoSearchSchema,
  loaderDeps: ({ search }) => ({ crash: search.demo === "crash", fail: search.demo === "error" }),
  loader: async ({ deps }) => {
    if (deps.crash) return await getStarterStatus({ data: { fail: true } });
    return await loadStarterStatus(deps.fail);
  },
  component: Home,
});

const features: { icon: IconSvgElement; title: string; desc: string }[] = [
  {
    icon: CancelCircleIcon,
    title: "React checks",
    desc: "React lint rules catch missing dependencies, conditional hooks, and state derived through effects. Agent docs explain when to use effects, event handlers, and route loaders.",
  },
  {
    icon: AiBookIcon,
    title: "Progressive agent docs",
    desc: "AGENTS.md links to focused guides for routing, React, testing, and the toolchain. Agents can read the guide that applies to the change.",
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
    title: "Feedback on every edit",
    desc: "Portable Edit Feedback formats, lints, and typechecks each file the moment it is written, and a Tool Guard refuses hook bypasses and edits to generated files before they happen. Import and Tailwind class sorting happen automatically.",
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
    what: "Project-owned hooks for Claude Code and Codex format, lint, and typecheck every edited file. Mistakes surface in seconds, not at code review.",
  },
  {
    when: "on commit",
    what: "Staged files are formatted and checked for lint and type errors. React Doctor adds advisory feedback before the commit.",
  },
  {
    when: "on push",
    what: "The checks run formatting, lint, types, unit tests, a production build, dead-code analysis, and Playwright browser tests. A failing check blocks the push.",
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

type StarterStatus = Awaited<ReturnType<typeof loadStarterStatus>>;

function StarterStatusCard({ starterStatus }: { starterStatus: StarterStatus }) {
  const failed = starterStatus.state === "error";

  return (
    <div
      className="mt-8 grid gap-5 rounded-xl border border-border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
      role={failed ? "alert" : "status"}
    >
      <div>
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2 rounded-full", failed ? "bg-warning" : "bg-success")}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {failed ? "Handled server error" : "Live full-stack example"}
          </h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {starterStatus.message}
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          route loader → server function → rendered result
        </p>
      </div>
      <Link
        to="/"
        search={failed ? {} : { demo: "error" }}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand"
      >
        {failed ? "Return to ready state" : "Preview the error path"}
        <Icon
          icon={ArrowRight01Icon}
          className="size-3 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

// Defined at module scope because React Compiler can't compile import() inside a component.
// LazyMotion also gets the same loader on every render.
const loadMotionFeatures = () => import("motion/react").then((mod) => mod.domAnimation);

function Home() {
  const starterStatus = Route.useLoaderData();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <LazyMotion features={loadMotionFeatures}>
      <div className="bg-background selection:bg-brand/20">
        {/* Hero — fills viewport */}
        <section className="flex min-h-dvh flex-col justify-center px-6 sm:px-10">
          <div className="mx-auto w-full max-w-2xl">
            {/* Brand */}
            <Wordmark animate={!prefersReducedMotion} />

            {/* Tagline */}
            <h1 className="mt-4 text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Built for{" "}
              {prefersReducedMotion ? (
                <span className="text-brand">agents.</span>
              ) : (
                <RotatingWord />
              )}
            </h1>

            {/* Description */}
            <p className="mt-3 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
              A React starter with formatting, lint checks, and tests wired into Git hooks. Includes
              routing, server rendering, and agent docs. Free and open source.
            </p>

            {/* Actions */}
            <div className="mt-10">
              <Snippet text="npx degit quinnsprouse/rodeo my-app" shimmer className="w-full" />

              <div className="mt-5 flex items-center gap-5">
                <a
                  href="https://github.com/quinnsprouse/rodeo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand"
                >
                  <Icon icon={Github01Icon} className="size-4" aria-hidden="true" />
                  GitHub
                  <Icon
                    icon={ArrowRight01Icon}
                    className="size-3 -translate-x-1 opacity-0 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100"
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
            </div>
          </div>
        </section>

        {/* The feedback loop — terminal replay + how it works behind the scenes */}
        <section className="border-t border-border/40">
          <div className="mx-auto w-full max-w-2xl px-6 pt-20 pb-24 sm:px-10">
            <p className="mb-3 text-sm text-muted-foreground">The feedback loop</p>
            <h2 className="max-w-md text-xl leading-snug font-bold tracking-tight text-foreground">
              Check changes before they reach main.
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
              Run focused checks while editing, then build and test the app before pushing.
            </p>

            <TerminalDemo className="mt-10" />

            <StarterStatusCard starterStatus={starterStatus} />

            <div className="mt-12 space-y-8">
              {loop.map((step) => (
                <div key={step.when} className="grid gap-2 sm:grid-cols-[200px_1fr] sm:gap-8">
                  <p className="font-mono text-sm font-medium text-brand">{step.when}</p>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
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
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      {f.title}
                    </h2>
                  </div>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
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
