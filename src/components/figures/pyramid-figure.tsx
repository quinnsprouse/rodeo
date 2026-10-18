import { useRef, useState } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { layerFocus, layerUnder, PyramidSlices, pyramidSlices } from "@/components/pyramid-slices";
import { useBeats } from "@/hooks/use-beats";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { cn } from "@/lib/utils";

const beats = [420, 420, 420, 380];
const sheenBeat = pyramidSlices.length;
const lastLayer = pyramidSlices.length - 1;

function Sheen() {
  return (
    <svg
      viewBox="0 0 320 252"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full text-background dark:text-foreground"
    >
      <defs>
        <clipPath id="pyramid-sheen-clip">
          {pyramidSlices.map((slice) => (
            <path key={slice.name} d={slice.shape} />
          ))}
        </clipPath>
        <linearGradient id="pyramid-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity={0} />
          <stop offset="0.5" stopColor="currentColor" stopOpacity={0.5} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath="url(#pyramid-sheen-clip)">
        <rect width="320" height="100" fill="url(#pyramid-sheen)" className="sheen-sweep" />
      </g>
    </svg>
  );
}

export function PyramidFigure() {
  const card = useRef<HTMLDivElement>(null);
  const playback = useScrollPlayback(card);
  const beat = useBeats(beats, playback);
  const reducedMotion = usePrefersReducedMotion();
  const [focused, setFocused] = useState<string | null>(null);
  const visible = beat + 1;

  return (
    <Figure caption="most of the work happens at the top." waiting={playback === "waiting"}>
      <Card ref={card} className="py-xl">
        <div
          onPointerOver={(event) => setFocused(layerUnder(event) ?? null)}
          onPointerLeave={() => setFocused(null)}
          className="flex items-center justify-center gap-l sm:gap-xl"
        >
          <div className="relative w-[150px] shrink-0 sm:w-[220px]">
            <PyramidSlices focused={focused} visible={visible} className="w-full" />
            {playback === "playing" && beat >= sheenBeat && !reducedMotion && <Sheen />}
          </div>
          <ol className="flex h-[118px] flex-col justify-around text-s whitespace-nowrap sm:h-[173px]">
            {pyramidSlices.map(({ name }, index) => (
              <li
                key={name}
                data-layer={name}
                className={cn(
                  layerFocus,
                  index === lastLayer ? "text-muted-foreground" : "text-foreground",
                  focused && focused !== name && "opacity-40",
                  index >= visible && "-translate-x-1.5 opacity-0 blur-xs",
                )}
              >
                {name}
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </Figure>
  );
}
