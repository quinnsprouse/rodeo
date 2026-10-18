import { useRef, type ReactNode } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { useBeats } from "@/hooks/use-beats";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { concealed, reveal } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

const beats = [380, 380, 380, 300];
const reasonsBeat = 3;

function Reason({ lit, children }: { lit: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "-mx-0.5 rounded-xs px-0.5 transition-colors duration-300 ease-(--motion-large-easing)",
        lit && "bg-primary-transparent text-foreground",
      )}
    >
      {children}
    </span>
  );
}

function exitsFor(lit: boolean) {
  return [
    {
      rule: "lint exception",
      exit: (
        <>
          An entry in vite.config.ts with a <Reason lit={lit}>why:</Reason> comment
        </>
      ),
    },
    {
      rule: "comment",
      exit: (
        <>
          <Reason lit={lit}>why:</Reason> plus the dependency, browser, or spec, in 6 to 30 words
        </>
      ),
    },
    {
      rule: "skipping a hook",
      exit: (
        <>
          Only <Reason lit={lit}>a person</Reason> can
        </>
      ),
    },
  ];
}

export function ExitsFigure() {
  const card = useRef<HTMLDivElement>(null);
  const beat = useBeats(beats, useScrollPlayback(card));

  return (
    <Figure caption="one way out per rule, and it always leaves a reason.">
      <Card ref={card}>
        <dl className="grid gap-x-s gap-y-s text-s sm:grid-cols-[168px_1fr]">
          {exitsFor(beat >= reasonsBeat).map(({ rule, exit }, index) => {
            const hidden = beat < index;
            return (
              <div key={rule} className="contents">
                <dt
                  className={cn(
                    "flex items-center gap-s self-start font-data text-foreground",
                    reveal,
                    hidden && concealed,
                  )}
                >
                  {rule}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px grow origin-left bg-border transition-transform delay-100 duration-500 ease-(--motion-large-easing) max-sm:hidden",
                      hidden && "scale-x-0",
                    )}
                  />
                </dt>
                <dd
                  className={cn(
                    "mb-xs self-start text-muted-foreground delay-200 sm:mb-0",
                    reveal,
                    hidden && concealed,
                  )}
                >
                  {exit}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>
    </Figure>
  );
}
