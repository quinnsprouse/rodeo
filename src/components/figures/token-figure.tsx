import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { useBeats } from "@/hooks/use-beats";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { hoveredData } from "@/lib/hover";
import { concealed, reveal } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

const loadParticles = () => import("@/components/figures/particles");
const CoinSpill = lazy(() => loadParticles().then((mod) => ({ default: mod.CoinSpill })));

function preloadParticles() {
  void loadParticles();
}

const task = { part: "task", label: "the actual task", swatch: "bg-primary", grow: "grow-[96]" };

const overhead = [
  { part: "comments", label: "reading comments", swatch: "bg-muted-foreground", grow: "grow-[84]" },
  { part: "tests", label: "fixing unit tests", swatch: "bg-neutral-6", grow: "grow-[110]" },
  { part: "docs", label: "reading docs", swatch: "bg-neutral-4", grow: "grow-[76]" },
];

const beats = [650, 560, 560, 600, 300];
const rodeoOverheadBeat = 3;
const legendBeat = 4;

interface SegmentProps {
  part: string;
  swatch: string;
  grow: string;
  shown: boolean;
  focused: string | null;
}

function Segment({ part, swatch, grow, shown, focused }: SegmentProps) {
  return (
    <span
      data-part={part}
      className={cn(
        "flex transition-opacity duration-(--motion-duration) ease-(--motion-easing)",
        grow,
        focused && focused !== part && "opacity-30",
      )}
    >
      <span className="flex w-full overflow-hidden rounded-s">
        <span
          className={cn(
            "w-full rounded-s transition-transform duration-500 ease-(--motion-large-easing)",
            swatch,
            !shown && "-translate-x-full",
          )}
        />
      </span>
    </span>
  );
}

function Track({
  width = "w-full",
  overlay,
  children,
}: {
  width?: string;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative rounded-m bg-muted p-0.75">
      <div className={cn("flex h-6 gap-0.75", width)}>{children}</div>
      {overlay}
    </div>
  );
}

export function TokenBarsFigure() {
  const card = useRef<HTMLDivElement>(null);
  const playback = useScrollPlayback(card);
  const beat = useBeats(beats, playback);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (playback === "waiting") preloadParticles();
  }, [playback]);

  return (
    <Figure
      caption="where an agent's tokens go on one change. an illustration, not a benchmark."
      waiting={playback === "waiting"}
    >
      <Card ref={card} className="py-xl">
        <div
          onPointerOver={(event) => setFocused(hoveredData(event, "part"))}
          onPointerLeave={() => setFocused(null)}
          className="space-y-m"
        >
          <div className="grid grid-cols-[96px_1fr] items-center gap-m text-s sm:grid-cols-[112px_1fr]">
            <span className="text-foreground">without rodeo</span>
            <Track
              overlay={
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0.75 flex gap-0.75"
                >
                  <span className={task.grow} />
                  {overhead.map((item, index) => (
                    <span key={item.part} className={cn("relative", item.grow)}>
                      {playback !== "static" && (
                        <Suspense fallback={null}>
                          <CoinSpill spill={index} play={playback === "playing" && beat > index} />
                        </Suspense>
                      )}
                    </span>
                  ))}
                </div>
              }
            >
              <Segment {...task} shown={beat >= 0} focused={focused} />
              {overhead.map((item, index) => (
                <Segment key={item.part} {...item} shown={beat > index} focused={focused} />
              ))}
            </Track>

            <span className="text-foreground">rodeo</span>
            <Track width="w-[30%]">
              <Segment {...task} shown={beat >= 0} focused={focused} />
              <Segment
                part="docs"
                swatch="bg-neutral-4"
                grow="grow-[14]"
                shown={beat >= rodeoOverheadBeat}
                focused={focused}
              />
            </Track>
          </div>

          <ul
            className={cn(
              "flex flex-wrap gap-x-l gap-y-xs text-xs text-muted-foreground sm:pl-32",
              reveal,
              beat < legendBeat && concealed,
            )}
          >
            {[task, ...overhead].map((item) => (
              <li
                key={item.part}
                data-part={item.part}
                className={cn(
                  "flex cursor-default items-center gap-xs transition-colors duration-(--motion-duration) ease-(--motion-easing)",
                  focused === item.part && "text-foreground",
                )}
              >
                <span className={cn("size-2.5 rounded-xs", item.swatch)} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </Figure>
  );
}
