import { useRef } from "react";

import { ExternalLink } from "@/demo/external-link";
import { PageSection } from "@/demo/landing/page-section";
import { links } from "@/demo/links";
import { useFigurePlayback } from "@/demo/philosophy/figures/use-figure-playback";
import { LighthouseSticker } from "@/demo/stickers/reach";
import type { Playback } from "@/hooks/use-play-on-view";
import { cn } from "@/lib/utils";

const scores = [
  { category: "Performance", score: 100 },
  { category: "Accessibility", score: 100 },
  { category: "Best practices", score: 100 },
  { category: "SEO", score: 100 },
];

const arc = "M 12 60 A 48 48 0 0 1 108 60";

function Gauge({
  category,
  score,
  order,
  playback,
}: {
  category: string;
  score: number;
  order: number;
  playback: Playback;
}) {
  return (
    <div
      data-empty={playback === "waiting" ? "" : undefined}
      style={{ "--gauge-score": score, "--gauge-order": order }}
      className="flex flex-col-reverse items-center gap-xs gauge"
    >
      <dt className="text-s text-muted-foreground">{category}</dt>
      <dd className="relative w-full max-w-36">
        <svg viewBox="0 0 120 66" fill="none" aria-hidden="true" className="w-full">
          <path d={arc} strokeWidth="10" strokeLinecap="round" className="stroke-muted" />
          <path
            d={arc}
            pathLength="100"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-success gauge-arc"
          />
        </svg>
        <span className="sr-only">{score}</span>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 text-center font-brand text-xl font-heavy text-foreground tabular-nums gauge-count"
        />
      </dd>
    </div>
  );
}

export function LighthouseSection() {
  const gauges = useRef<HTMLDListElement>(null);
  const { playback, held } = useFigurePlayback(gauges);

  return (
    <PageSection>
      <LighthouseSticker className="size-14" />
      <h2 className="mt-s font-brand text-l font-heavy text-foreground">
        All four scores start at 100.
      </h2>
      <p className="mt-s max-w-[520px] text-muted-foreground">
        Rodeo renders on the server and subsets fonts, so this site scores 100 in every Lighthouse
        category on mobile. Push checks don't run Lighthouse, just a size budget and an axe scan.
      </p>

      <dl
        ref={gauges}
        className={cn(
          "mt-xl grid grid-cols-2 gap-x-l gap-y-xl sm:grid-cols-4",
          held && "hold-entrance",
          playback === "waiting" && "hold-still",
        )}
      >
        {scores.map(({ category, score }, order) => (
          <Gauge
            key={category}
            category={category}
            score={score}
            order={order}
            playback={playback}
          />
        ))}
      </dl>

      <p className="mt-xl text-s text-muted-foreground">
        Lighthouse 13.6, mobile, five runs per page.{" "}
        <ExternalLink
          href={links.pageSpeed}
          className="text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground"
        >
          Run it yourself
        </ExternalLink>
      </p>
    </PageSection>
  );
}
