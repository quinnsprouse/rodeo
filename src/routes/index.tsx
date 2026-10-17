import type { IconSvgElement } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as z from "zod/mini";

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

const demoSearchSchema = z.object({
  demo: z.catch(z.optional(z.enum(["crash", "error"])), undefined),
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
  head: () => ({
    links: [
      // why: Penflow loads the font with fetch(), so the preload uses as="fetch" to match it.
      {
        rel: "preload",
        href: "/fonts/Yellowtail-Regular.ttf",
        as: "fetch",
        crossOrigin: "anonymous",
      },
    ],
  }),
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
    what: "The checks run formatting, lint, types, guardrail tests, a production build, dead-code analysis, and Playwright browser tests. A failing check blocks the push.",
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
      className="mt-xl grid gap-l rounded-l bg-card p-l ring ring-border sm:grid-cols-[1fr_auto] sm:items-center"
      role={failed ? "alert" : "status"}
    >
      <div>
        <div className="flex items-center gap-xs">
          <span
            className={cn("size-2 rounded-full", failed ? "bg-warning" : "bg-success")}
            aria-hidden="true"
          />
          <h3 className="text-s font-medium text-foreground">
            {failed ? "Handled server error" : "Live full-stack example"}
          </h3>
        </div>
        <p className="mt-xs text-s text-muted-foreground">{starterStatus.message}</p>
        <p className="mt-xs font-data text-xs text-muted-foreground">
          route loader → server function → rendered result
        </p>
      </div>
      <Link
        to="/"
        search={failed ? {} : { demo: "error" }}
        className="group inline-flex items-center gap-xs text-s font-medium text-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-primary"
      >
        {failed ? "Return to ready state" : "Preview the error path"}
        <Icon
          icon={ArrowRight01Icon}
          className="size-3 transition-transform duration-(--motion-duration) ease-(--motion-easing) group-hover:translate-x-xxs"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

function Home() {
  const starterStatus = Route.useLoaderData();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="bg-background selection:bg-primary-transparent">
      <section className="flex min-h-dvh flex-col justify-center px-l sm:px-xl">
        <div className="mx-auto w-full max-w-2xl">
          <Wordmark animate={!prefersReducedMotion} />

          <h1 className="mt-m font-brand text-l font-heavy text-foreground sm:text-xl">
            Built for{" "}
            {prefersReducedMotion ? (
              <span className="text-primary">agents.</span>
            ) : (
              <RotatingWord />
            )}
          </h1>

          <p className="mt-s max-w-md text-muted-foreground">
            A React starter with formatting, lint checks, and tests wired into Git hooks. Includes
            routing, server rendering, and agent docs. Free and open source.
          </p>

          <div className="mt-xl">
            <Snippet text="npx degit quinnsprouse/rodeo my-app" shimmer className="w-full" />

            <div className="mt-l flex items-center gap-l">
              <a
                href="https://github.com/quinnsprouse/rodeo"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-xs text-s font-medium text-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-primary"
              >
                <Icon icon={Github01Icon} className="size-4" aria-hidden="true" />
                GitHub
                <Icon
                  icon={ArrowRight01Icon}
                  className="size-3 -translate-x-xxs opacity-0 transition duration-(--motion-duration) ease-(--motion-easing) group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </a>
              <a
                href="https://viteplus.dev/guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-s text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground"
              >
                Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="divider-t">
        <div className="mx-auto w-full max-w-2xl px-l py-xxl sm:px-xl">
          <p className="mb-s text-s text-muted-foreground">The feedback loop</p>
          <h2 className="max-w-md font-brand text-l font-heavy text-foreground">
            Check changes before they reach main.
          </h2>
          <p className="mt-s max-w-md text-muted-foreground">
            Run focused checks while editing, then build and test the app before pushing.
          </p>

          <TerminalDemo className="mt-xl" />

          <StarterStatusCard starterStatus={starterStatus} />

          <div className="mt-xxl space-y-xl">
            {loop.map((step) => (
              <div key={step.when} className="grid gap-xs sm:grid-cols-[200px_1fr] sm:gap-xl">
                <p className="font-data text-s font-medium text-primary">{step.when}</p>
                <p className="text-s text-muted-foreground">{step.what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="divider-t">
        <div className="mx-auto w-full max-w-2xl px-l py-xxl sm:px-xl">
          <p className="mb-xxl text-s text-muted-foreground">What ships out of the box</p>

          <div className="space-y-xl">
            {features.map((f) => (
              <div key={f.title} className="grid gap-s sm:grid-cols-[200px_1fr] sm:gap-xl">
                <div className="flex items-start gap-xs">
                  <Icon
                    icon={f.icon}
                    className="mt-xxs size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="font-medium text-foreground">{f.title}</h2>
                </div>
                <p className="text-s text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="divider-t">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-m gap-y-xxs p-l sm:gap-x-l sm:px-xl">
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
