import { m } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

// ease-out-quint — matches the hero entrance easing
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

type LineKind = "cmd" | "ok" | "dim" | "note";

const lines: { kind: LineKind; text: string }[] = [
  { kind: "cmd", text: 'git commit -m "feat: add billing page"' },
  { kind: "dim", text: "vp staged" },
  { kind: "ok", text: "formatted 4 files — imports and Tailwind classes sorted" },
  { kind: "ok", text: "0 lint errors, 0 type errors" },
  { kind: "ok", text: "react-doctor — no regressions on staged files" },
  { kind: "dim", text: "[main 1f2a9c3] feat: add billing page" },
  { kind: "cmd", text: "git push" },
  { kind: "ok", text: "check — fmt · lint · types · unit tests" },
  { kind: "ok", text: "build + knip — production-ready, no dead code" },
  { kind: "ok", text: "playwright — 4 e2e passed (7.2s)" },
  { kind: "note", text: "shipped. nothing broken." },
];

/**
 * A mock terminal replaying the guardrail loop that runs on every commit and
 * push. Lines stagger in as the panel scrolls into view.
 */
export function TerminalDemo({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-[oklch(0.17_0.005_285)] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_40px_-16px_rgba(134,59,255,0.25)]",
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="ml-2 font-mono text-[11px] text-white/30">my-app — zsh</span>
      </div>

      {/* Replay */}
      <div className="space-y-1.5 overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed sm:px-5">
        {lines.map((line, i) => (
          <m.div
            key={line.text}
            initial={reducedMotion ? false : { opacity: 0, y: 6, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: i * 0.09, ease: EASE_OUT }}
            className={cn(
              "flex items-baseline gap-2 whitespace-nowrap",
              line.kind === "cmd" && "text-white/90",
              line.kind === "ok" && "text-white/55",
              line.kind === "dim" && "text-white/30",
              line.kind === "note" && "pt-1 text-[#b794ff]",
            )}
          >
            {line.kind === "cmd" && <span className="text-white/30 select-none">$</span>}
            {line.kind === "ok" && <span className="text-emerald-400 select-none">✓</span>}
            {line.kind === "note" && <span className="select-none">→</span>}
            <span>{line.text}</span>
          </m.div>
        ))}
      </div>
    </div>
  );
}
