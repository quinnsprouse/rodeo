import type { IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Calligraph } from "calligraph";
import { LazyMotion, m, useReducedMotion } from "motion/react";
import type { ComponentType } from "react";
import { useState } from "react";

import { Icon, Twotone, Github01Icon, ArrowRight01Icon } from "@/components/icons";
import { Snippet } from "@/components/ui/snippet";
import { useMountEffect } from "@/hooks/use-mount-effect";

export const Route = createFileRoute("/")({
  component: Home,
});

const rotatingWords = ["agents.", "humans.", "teams.", "you."];

// ease-out-quint — snappy entrance, settles naturally (Emil Kowalski's animation principles)
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const features: { icon: IconSvgElement; title: string; desc: string }[] = [
  {
    icon: Twotone.CancelCircleIcon,
    title: "No useEffect",
    desc: "Banned via lint rule. Agents and developers use useMountEffect for mount-only sync\u2009\u2014\u2009no race conditions, no infinite loops, no implicit control flow.",
  },
  {
    icon: Twotone.AiBookIcon,
    title: "Progressive agent docs",
    desc: "AGENTS.md is 15 lines. Detailed guidance lives in docs/agents/ and loads only when relevant\u2009\u2014\u2009keeping context windows small and agents focused.",
  },
  {
    icon: Twotone.Shield01Icon,
    title: "Three-layer quality gate",
    desc: "Pre-commit formats and lints staged files. Pre-push runs the full check suite plus Playwright e2e. Commitlint enforces Conventional Commits.",
  },
  {
    icon: Twotone.Bug01Icon,
    title: "Zero-config linting",
    desc: "oxlint with react, react-perf, jsx-a11y, and TypeScript plugins. TanStack Router and Query rules via ESLint bridge. Type-aware, no setup needed.",
  },
  {
    icon: Twotone.MagicWand01Icon,
    title: "Auto-format on every edit",
    desc: "Claude hooks run oxfmt and typecheck after every file write. Import sorting and Tailwind class sorting happen automatically\u2009\u2014\u2009agents never ship unformatted code.",
  },
  {
    icon: Twotone.Target01Icon,
    title: "Dead code detection",
    desc: "Knip catches unused exports, dependencies, and files. One command to keep the codebase lean as it grows.",
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

// typr.js (penflow dep) references `window` at import time — dynamic import avoids SSR crash
function useClientPenflow() {
  const [Comp, setComp] = useState<ComponentType<Record<string, unknown>> | null>(null);

  useMountEffect(() => {
    void import("penflow/react").then((m) =>
      setComp(() => m.Penflow as ComponentType<Record<string, unknown>>),
    );
  });

  return Comp;
}

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
  const prefersReducedMotion = useReducedMotion();
  const skip = !!prefersReducedMotion;
  const currentWord = useRotatingWord(rotatingWords, 2500);
  const Penflow = useClientPenflow();

  return (
    <LazyMotion features={() => import("motion/react").then((mod) => mod.domAnimation)}>
      <div className="bg-white selection:bg-[#863bff]/20">
        {/* Hero — fills viewport */}
        <section className="flex min-h-dvh flex-col justify-center px-6 sm:px-10">
          <div className="mx-auto w-full max-w-2xl">
            {/* Brand */}
            <div className="-ml-12 h-[172px]">
              {Penflow && (
                <Penflow
                  text="Rodeo"
                  fontUrl="/fonts/Yellowtail-Regular.ttf"
                  color="#863bff"
                  size={128}
                  brushScale={0.12}
                  quality="calm"
                  seed="rodeo"
                  animate={!skip}
                />
              )}
            </div>

            {/* Tagline */}
            <m.h1
              className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.2] font-bold tracking-[-0.03em] text-foreground"
              initial={skip ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5, ease: EASE_OUT }}
            >
              Built for{" "}
              <Calligraph as="span" className="text-[#863bff]" animation="smooth" trend={1}>
                {currentWord}
              </Calligraph>
            </m.h1>

            {/* Description */}
            <m.p
              className="mt-3 max-w-sm text-[15px] leading-[1.65] text-pretty text-muted-foreground"
              initial={skip ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65, ease: EASE_OUT }}
            >
              Guardrails that keep AI agents&#x2009;&#x2014;&#x2009;and
              developers&#x2009;&#x2014;&#x2009;writing correct code by default.
            </m.p>

            {/* Actions */}
            <m.div
              className="mt-10"
              initial={skip ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8, ease: EASE_OUT }}
            >
              <Snippet text="npx degit quinnsprouse/rodeo my-app" className="w-full" />

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
          <div className="mx-auto flex w-full max-w-2xl items-center gap-x-1.5 px-6 py-8 sm:px-10">
            {stack.map((s, i) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {s.name}
                {i < stack.length - 1 && (
                  <span className="ml-1.5 text-muted-foreground/25" aria-hidden="true">
                    /
                  </span>
                )}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
