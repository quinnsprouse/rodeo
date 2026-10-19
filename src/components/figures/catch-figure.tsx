import { useRef, type ReactNode } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { Cancel01Icon, Icon, Tick02Icon } from "@/components/icons";
import { useBeats } from "@/hooks/use-beats";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { concealed, iconOut, iconSwap, reveal } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

const stops = [
  { label: "edit", at: "left-0", align: "translate-x-0" },
  { label: "commit", at: "left-1/2", align: "-translate-x-1/2" },
  { label: "pull request", at: "left-full", align: "-translate-x-full" },
];
const rodeoStopDelays = ["delay-0", "delay-700", "delay-1300"];

const beats = [500, 1700, 300];
const spotted = 0;
const handled = 1;
const arrived = 2;

const dot = "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full";
const marker = "absolute top-1/2 left-0 size-5 -translate-x-1/2 -translate-y-1/2";
const badge = "absolute inset-0 grid place-items-center rounded-full";

function Track({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-6">
      <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
      {children}
    </div>
  );
}

function Mistake({ shown }: { shown: boolean }) {
  return (
    <span
      className={cn(
        badge,
        "m-auto size-3 bg-destructive ring-4 ring-destructive-transparent",
        iconSwap,
        !shown && iconOut,
      )}
    />
  );
}

function Outcome({
  shown,
  className,
  children,
}: {
  shown: boolean;
  className?: string;
  children: string;
}) {
  return (
    <p
      className={cn("mt-xxs text-xs text-muted-foreground", reveal, !shown && concealed, className)}
    >
      {children}
    </p>
  );
}

export function CatchFigure() {
  const card = useRef<HTMLDivElement>(null);
  const playback = useScrollPlayback(card);
  const beat = useBeats(beats, playback);

  return (
    <Figure caption="the same mistake, and where it gets caught." waiting={playback === "waiting"}>
      <Card ref={card}>
        <div className="grid items-center gap-x-m gap-y-xxs text-s sm:grid-cols-[112px_1fr] sm:gap-y-s">
          <span className="hidden sm:block" />
          <div className="relative h-4 px-2.5 text-xs text-muted-foreground">
            <div className="relative h-full">
              {stops.map(({ label, at, align }) => (
                <span key={label} className={cn("absolute top-0 whitespace-nowrap", at, align)}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <span className="mt-s self-start pt-0.5 text-foreground sm:mt-0">without rodeo</span>
          <div className="px-2.5">
            <Track>
              {stops.map(({ label, at }) => (
                <span key={label} className={cn(dot, at, "bg-neutral-4")} />
              ))}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 transition-transform duration-1600 ease-in-out",
                  beat >= handled && "translate-x-full",
                )}
              >
                <span className={marker}>
                  <Mistake shown={beat >= spotted && beat < arrived} />
                  <span
                    className={cn(
                      badge,
                      "bg-destructive text-destructive-foreground",
                      iconSwap,
                      beat < arrived && iconOut,
                    )}
                  >
                    <Icon icon={Cancel01Icon} size={12} aria-hidden="true" />
                  </span>
                </span>
              </span>
            </Track>
            <Outcome shown={beat >= arrived} className="text-right">
              caught in the pull request
            </Outcome>
          </div>

          <span className="mt-s self-start pt-0.5 text-foreground sm:mt-0">rodeo</span>
          <div className="px-2.5">
            <Track>
              <span
                className={cn(
                  "absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-1/2 rounded-full bg-primary transition-transform delay-200 duration-1400 ease-in-out",
                  beat < handled && "scale-x-0",
                )}
              />
              {stops.map(({ label, at }, index) => (
                <span
                  key={label}
                  className={cn(
                    dot,
                    at,
                    "transition-colors duration-300",
                    rodeoStopDelays[index],
                    beat >= handled ? "bg-primary" : "bg-neutral-4",
                  )}
                />
              ))}
              <span aria-hidden="true" className={marker}>
                <Mistake shown={beat >= spotted && beat < handled} />
                <span
                  className={cn(
                    badge,
                    "bg-primary text-primary-foreground",
                    iconSwap,
                    beat < handled && iconOut,
                  )}
                >
                  <Icon icon={Tick02Icon} size={12} aria-hidden="true" />
                </span>
              </span>
            </Track>
            <Outcome shown={beat >= handled}>fixed on the edit</Outcome>
          </div>
        </div>
      </Card>
    </Figure>
  );
}
