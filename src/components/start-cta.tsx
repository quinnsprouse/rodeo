import { Link } from "@tanstack/react-router";

import { ArrowRight01Icon, Github01Icon, Icon } from "@/components/icons";
import { EditSticker, PushSticker } from "@/components/stickers/swap";
import { StaticAnalysisSticker } from "@/components/stickers/topics";
import { Snippet } from "@/components/ui/snippet";

const link =
  "inline-flex items-center gap-xs underline-offset-4 hover:underline focus-visible:outline-primary-foreground";

export function StartCta({ installCommand }: { installCommand: string }) {
  return (
    <div className="group/cta relative rounded-l bg-primary p-l text-primary-foreground sm:p-xl">
      <div className="pointer-events-none" aria-hidden="true">
        <EditSticker className="absolute -top-0.5 right-18 size-12 transition-transform duration-(--motion-large-duration) ease-(--motion-large-easing) motion-safe:group-hover/cta:-rotate-12 sm:top-1 sm:right-27 sm:size-16" />
        <StaticAnalysisSticker className="absolute -top-5.5 right-8 size-13 transition-transform duration-(--motion-large-duration) ease-(--motion-large-easing) motion-safe:group-hover/cta:-translate-y-1 motion-safe:group-hover/cta:rotate-6 sm:-top-6 sm:right-12 sm:size-17" />
        <PushSticker className="absolute top-1.5 -right-0.5 size-14.5 transition-transform duration-(--motion-large-duration) ease-(--motion-large-easing) motion-safe:group-hover/cta:translate-x-1 motion-safe:group-hover/cta:-translate-y-2 sm:top-4.5 sm:-right-2 sm:size-20" />
      </div>

      <h2 className="max-w-[240px] font-brand text-l font-heavy tracking-xs sm:max-w-[440px] sm:text-xl">
        Start with the guardrails in place.
      </h2>
      <p className="mt-s max-w-[460px]">
        Clone it and point Claude Code or Codex at AGENTS.md. Both run the same hooks, and Vite+,
        TanStack Start, React 19, Tailwind v4, and shadcn/ui come set up.
      </p>

      <Snippet text={installCommand} className="mt-xl w-full" />

      <div className="mt-l flex flex-wrap items-center gap-l text-s font-medium">
        <a
          href="https://github.com/quinnsprouse/rodeo"
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          <Icon icon={Github01Icon} className="size-4" aria-hidden="true" />
          GitHub
        </a>
        <Link to="/rationale" className={link}>
          Read the philosophy
          <Icon icon={ArrowRight01Icon} className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
