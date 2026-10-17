import { LazyMotion, m } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const largeMotion: { duration: number; ease: [number, number, number, number] } = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1],
};

const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.domAnimation);

type LineKind = "cmd" | "ok" | "dim" | "note";

const lines: { kind: LineKind; text: string }[] = [
  { kind: "cmd", text: 'git commit -m "feat: add billing page"' },
  { kind: "dim", text: "vp staged" },
  { kind: "ok", text: "formatted 4 files — imports and Tailwind classes sorted" },
  { kind: "ok", text: "0 lint errors, 0 type errors" },
  { kind: "ok", text: "react-doctor — no regressions on staged files" },
  { kind: "dim", text: "[main 1f2a9c3] feat: add billing page" },
  { kind: "cmd", text: "git push" },
  { kind: "ok", text: "check — fmt · lint · types · guardrail tests" },
  { kind: "ok", text: "build + knip — production-ready, no dead code" },
  { kind: "ok", text: "playwright — 4 e2e passed (7.2s)" },
  { kind: "note", text: "checks passed. ready to push." },
];

export function TerminalDemo({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "dark overflow-hidden rounded-l bg-card text-card-foreground ring ring-border",
        className,
      )}
    >
      <div className="flex items-center gap-xs px-m py-s divider-b">
        <span className="size-2.5 rounded-full bg-neutral-4" />
        <span className="size-2.5 rounded-full bg-neutral-4" />
        <span className="size-2.5 rounded-full bg-neutral-4" />
        <span className="ml-xs font-data text-xs text-muted-foreground">my-app — zsh</span>
      </div>

      <LazyMotion features={loadMotionFeatures} strict>
        <div className="space-y-xs overflow-x-auto p-m font-data text-xs sm:px-l">
          {lines.map((line, i) => (
            <m.div
              key={line.text}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ ...largeMotion, delay: i * 0.09 }}
              className={cn(
                // why: Motion renders the hidden initial state on the server, and without
                // JavaScript nothing would reveal the lines.
                "flex items-baseline gap-xs whitespace-nowrap noscript:transform-none! noscript:opacity-100!",
                line.kind === "cmd" && "text-foreground",
                line.kind === "ok" && "text-muted-foreground",
                line.kind === "dim" && "text-muted-foreground",
                line.kind === "note" && "pt-xxs text-primary",
              )}
            >
              {line.kind === "cmd" && <span className="text-muted-foreground select-none">$</span>}
              {line.kind === "ok" && <span className="text-success select-none">✓</span>}
              {line.kind === "note" && <span className="select-none">→</span>}
              <span>{line.text}</span>
            </m.div>
          ))}
        </div>
      </LazyMotion>
    </div>
  );
}
