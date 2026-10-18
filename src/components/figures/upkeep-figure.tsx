import { useRef, useState } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { hoveredData } from "@/lib/hover";
import { reveal } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

const series = [
  {
    name: "most codebases",
    path: "M6 164 C 170 160, 330 118, 496 18",
    end: 18,
    stroke: "stroke-muted-foreground",
    fill: "fill-muted-foreground",
    swatch: "bg-muted-foreground",
  },
  {
    name: "rodeo",
    path: "M6 164 C 190 160, 360 154, 496 146",
    end: 146,
    stroke: "stroke-primary",
    fill: "fill-primary",
    swatch: "bg-primary",
  },
];

const piledUp = `${series[0]?.path} L496 172 L6 172 Z`;
const yearEnd = "transition duration-300 ease-(--motion-large-easing) delay-1200";
const focusFade = "transition-opacity duration-(--motion-duration) ease-(--motion-easing)";

export function UpkeepFigure() {
  const card = useRef<HTMLDivElement>(null);
  const hidden = useScrollPlayback(card) === "waiting";
  const [focused, setFocused] = useState<string | null>(null);
  const dimmed = (name: string) => focused !== null && focused !== name;

  return (
    <Figure caption="the overhead piles up because every change has to read and fix more of it. also an illustration.">
      <Card ref={card}>
        <div
          onPointerOver={(event) => setFocused(hoveredData(event, "series"))}
          onPointerLeave={() => setFocused(null)}
        >
          <p className="text-xs text-muted-foreground">tokens spent on upkeep, per change</p>
          <svg
            viewBox="0 0 512 180"
            aria-hidden="true"
            className={cn("mt-s w-full text-muted-foreground wipe", hidden && "wipe-hidden")}
          >
            <defs>
              <linearGradient id="upkeep-pile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity={0.2} />
                <stop offset="1" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <line x1="0" y1="172" x2="512" y2="172" className="stroke-neutral-4" strokeWidth={1} />
            <path
              d={piledUp}
              fill="url(#upkeep-pile)"
              className={cn(focusFade, dimmed("most codebases") && "opacity-0")}
            />
            {series.map((line) => (
              <g
                key={line.name}
                data-series={line.name}
                className={cn(focusFade, dimmed(line.name) && "opacity-25")}
              >
                <path d={line.path} fill="none" strokeWidth={16} className="stroke-transparent" />
                <path
                  d={line.path}
                  fill="none"
                  strokeWidth={3}
                  strokeLinecap="round"
                  className={line.stroke}
                />
                <circle
                  cx="496"
                  cy={line.end}
                  r="4.5"
                  className={cn(
                    "origin-center transform-fill",
                    line.fill,
                    yearEnd,
                    hidden && "scale-25 opacity-0",
                  )}
                />
              </g>
            ))}
          </svg>
          <div className="mt-xs flex justify-between text-xs text-muted-foreground">
            <span>day one</span>
            <span className={cn(reveal, "delay-1200", hidden && "opacity-0")}>a year in</span>
          </div>
          <ul className="mt-s flex gap-l text-xs text-muted-foreground">
            {series.map((line) => (
              <li
                key={line.name}
                data-series={line.name}
                className={cn(
                  "flex cursor-default items-center gap-xs",
                  focusFade,
                  dimmed(line.name) && "opacity-50",
                  focused === line.name && "text-foreground",
                )}
              >
                <span className={cn("h-[3px] w-3.5 rounded-xs", line.swatch)} aria-hidden="true" />
                {line.name}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </Figure>
  );
}
