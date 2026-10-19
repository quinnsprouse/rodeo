import { useRef } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { PyramidDiagram, pyramidLayers } from "@/components/pyramid-diagram";
import { useEntrance } from "@/hooks/use-entrance";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";

function Sheen() {
  return (
    <svg
      viewBox="0 0 320 252"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full text-background dark:text-foreground"
    >
      <defs>
        <clipPath id="pyramid-sheen-clip">
          {pyramidLayers.map((layer) => (
            <path key={layer.name} d={layer.shape} />
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
  const entrance = useEntrance(playback, 700);

  return (
    <Figure caption="most of the work happens at the top." waiting={playback === "waiting"}>
      <Card ref={card} className="py-xl">
        <PyramidDiagram
          size="figure"
          entrance={entrance}
          overlay={playback === "playing" && entrance === "settled" && <Sheen />}
        />
      </Card>
    </Figure>
  );
}
