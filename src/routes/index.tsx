import type { IconSvgElement } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useState } from "react";
import { TextMorph } from "torph/react";

import { Icon, Twotone, Github01Icon, ArrowRight01Icon, ShadcnIcon } from "@/components/icons";
import { Snippet } from "@/components/ui/snippet";
import { useMountEffect } from "@/hooks/use-mount-effect";

export const Route = createFileRoute("/")({
  component: Home,
});

const rotatingWords = ["agents.", "humans.", "teams.", "you."];

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
    desc: "Claude hooks run oxfmt and typecheck after every file write. Import sorting and Tailwind class sorting happen automatically — agents never ship unformatted code.",
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

function useRotatingWord(words: string[], intervalMs = 2000) {
  const [index, setIndex] = useState(0);

  useMountEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  });

  return words[index];
}

function Home() {
  const prefersReducedMotion = useReducedMotion();
  const skip = !!prefersReducedMotion;
  const currentWord = useRotatingWord(rotatingWords, 2500);

  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-white selection:bg-[#863bff]/20">
        {/* Hero — fills viewport */}
        <section className="flex min-h-dvh flex-col justify-center px-6 sm:px-10">
          <div className="mx-auto w-full max-w-2xl">
            {/* Stack pill */}
            <m.div
              className="mb-8 flex w-fit items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5"
              initial={skip ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <a
                href="https://viteplus.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 48 46"
                  aria-hidden="true"
                >
                  <path
                    fill="#863bff"
                    d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
                  />
                </svg>
                Vite+
              </a>
              <span className="text-muted-foreground/30" aria-hidden="true">
                +
              </span>
              <a
                href="https://tanstack.com/start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                TanStack
              </a>
              <span className="text-muted-foreground/30" aria-hidden="true">
                +
              </span>
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                <Icon icon={ShadcnIcon} className="size-3" aria-hidden="true" />
                shadcn
              </a>
            </m.div>

            {/* Headline */}
            <m.h1
              className="text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.04em] text-balance text-foreground"
              initial={skip ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Built for{" "}
              <TextMorph as="span" className="text-[#863bff]" duration={600} respectReducedMotion>
                {currentWord}
              </TextMorph>
            </m.h1>

            {/* Description */}
            <m.p
              className="mt-4 max-w-sm text-[15px] leading-[1.65] text-pretty text-muted-foreground"
              initial={skip ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              A full-stack React starter with guardrails that keep AI
              agents&#x2009;&#x2014;&#x2009;and developers&#x2009;&#x2014;&#x2009;writing correct
              code by default.
            </m.p>

            {/* Actions */}
            <m.div
              className="mt-10"
              initial={skip ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Snippet
                text="npx degit quinnsprouse/viteplus-shadcn-starter my-app"
                className="w-full"
              />

              <div className="mt-4 flex items-center gap-5">
                <a
                  href="https://github.com/quinnsprouse/viteplus-shadcn-starter"
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
            <p className="mb-14 text-sm text-muted-foreground/50">What ships out of the box</p>

            <div className="space-y-12">
              {features.map((f, i) => (
                <m.div
                  key={f.title}
                  className="grid gap-3 sm:grid-cols-[200px_1fr] sm:gap-8"
                  initial={skip ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.04,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon
                      icon={f.icon}
                      className="mt-0.5 size-4 shrink-0 text-[#863bff]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                      {f.title}
                    </h3>
                  </div>
                  <p className="text-[13px] leading-[1.7] text-pretty text-muted-foreground/70">
                    {f.desc}
                  </p>
                </m.div>
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
                className="text-[11px] text-muted-foreground/40 transition-colors hover:text-foreground"
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
