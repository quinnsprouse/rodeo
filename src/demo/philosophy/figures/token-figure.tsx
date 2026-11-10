import { lazy, Suspense, useEffect, type ReactNode } from "react";

import { concealed, reveal } from "@/demo/motion-classes";
import { Figure, timeline, useFigure } from "@/demo/philosophy/figures/figure";
import { overhead, rodeoOverhead, task } from "@/demo/philosophy/figures/token-parts";
import { useHoveredData } from "@/demo/use-hovered-data";
import { cn } from "@/lib/utils";

const loadParticles = () => import("@/demo/philosophy/figures/particles");
const CoinSpill = lazy(() => loadParticles().then((mod) => ({ default: mod.CoinSpill })));

function preloadParticles() {
  void loadParticles();
}

const beats = timeline({ task: 650, comments: 560, tests: 560, docs: 600, legend: 300 });

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

const trackInner = { padding: "p-0.75", inset: "inset-0.75", gap: "gap-0.75" };

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
    <div className={cn("relative rounded-m bg-muted", trackInner.padding)}>
      <div className={cn("flex h-6", trackInner.gap, width)}>{children}</div>
      {overlay && (
        <div
          aria-hidden="true"
          className={cn("pointer-events-none absolute", trackInner.inset, "flex", trackInner.gap)}
        >
          {overlay}
        </div>
      )}
    </div>
  );
}

export function TokenBarsFigure() {
  const figure = useFigure(beats);
  const { playback, beat } = figure;
  const { hovered: focused, handlers } = useHoveredData("part");

  useEffect(() => {
    if (playback === "waiting") preloadParticles();
  }, [playback]);

  return (
    <Figure
      figure={figure}
      caption="where an agent's tokens go on one change. an illustration, not a benchmark."
      cardClassName="py-xl"
    >
      <div {...handlers} className="space-y-m">
        <div className="grid grid-cols-[96px_1fr] items-center gap-m text-s sm:grid-cols-[112px_1fr]">
          <span className="text-foreground">without rodeo</span>
          <Track
            overlay={
              <>
                <span className={task.grow} />
                {overhead.map((item, index) => (
                  <span key={item.part} className={cn("relative", item.grow)}>
                    {playback !== "static" && (
                      <Suspense fallback={null}>
                        <CoinSpill
                          spill={index}
                          play={playback === "playing" && beat >= beats.at(item.part)}
                        />
                      </Suspense>
                    )}
                  </span>
                ))}
              </>
            }
          >
            <Segment {...task} shown={beat >= beats.at(task.part)} focused={focused} />
            {overhead.map((item) => (
              <Segment
                key={item.part}
                {...item}
                shown={beat >= beats.at(item.part)}
                focused={focused}
              />
            ))}
          </Track>

          <span className="text-foreground">rodeo</span>
          <Track width="w-[30%]">
            <Segment {...task} shown={beat >= beats.at(task.part)} focused={focused} />
            <Segment
              {...rodeoOverhead}
              shown={beat >= beats.at(rodeoOverhead.part)}
              focused={focused}
            />
          </Track>
        </div>

        <ul
          className={cn(
            "flex flex-wrap gap-x-l gap-y-xs text-xs text-muted-foreground sm:pl-32",
            reveal,
            beat < beats.at("legend") && concealed,
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
    </Figure>
  );
}
