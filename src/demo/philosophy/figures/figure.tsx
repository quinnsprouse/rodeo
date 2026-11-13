import { useRef, type ReactNode, type RefObject } from "react";

import { useFigurePlayback } from "@/demo/philosophy/figures/use-figure-playback";
import { useBeats } from "@/demo/use-beats";
import type { Playback } from "@/hooks/use-play-on-view";
import { cn } from "@/lib/utils";

interface Timeline<Beat extends string> {
  delays: number[];
  at: (beat: Beat) => number;
}

export function timeline<Beat extends string>(delays: Record<Beat, number>): Timeline<Beat> {
  const names: string[] = Object.keys(delays);
  return { delays: Object.values(delays), at: (beat) => names.indexOf(beat) };
}

interface FigurePlayback {
  card: RefObject<HTMLDivElement | null>;
  playback: Playback;
  beat: number;
  held: boolean;
}

export function useFigure<Beat extends string>(beats?: Timeline<Beat>): FigurePlayback {
  const card = useRef<HTMLDivElement>(null);
  const { playback, held } = useFigurePlayback(card);
  const beat = useBeats(beats?.delays ?? [], beats ? playback : "static");
  return { card, playback, beat, held };
}

export function Figure({
  figure: { card, playback, held },
  caption,
  cardClassName,
  children,
}: {
  figure: FigurePlayback;
  caption: string;
  cardClassName?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn("py-s", playback === "waiting" && "hold-still")}>
      <div
        ref={card}
        className={cn(
          "rounded-l bg-background p-l ring ring-border",
          held && "hold-entrance",
          cardClassName,
        )}
      >
        {children}
      </div>
      <figcaption className="mt-s text-center text-xs text-pretty text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
