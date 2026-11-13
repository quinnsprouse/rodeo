import { useEffect, useState, type RefObject } from "react";

import type { Playback } from "@/hooks/use-play-on-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type Stage = "undecided" | "settled" | "waiting" | "cued" | "playing";

const playbackAt: Record<Stage, Playback> = {
  undecided: "static",
  settled: "static",
  waiting: "waiting",
  cued: "waiting",
  playing: "playing",
};

const playLine = 2 / 3;
const pastThePlayLine = { rootMargin: `0px 0px -${(1 - playLine) * 100}% 0px` };
const whollyOnScreen = { threshold: 1 };

function reached({ boundingClientRect: { top, bottom } }: IntersectionObserverEntry) {
  const pastTheLine = bottom > 0 && top <= window.innerHeight * playLine;
  const allOnScreen = top >= 0 && bottom <= window.innerHeight;
  return pastTheLine || allOnScreen;
}

function heldSinceFirstPaint(card: Element) {
  const content = card.firstElementChild;
  return content !== null && getComputedStyle(content).visibility === "hidden";
}

function stageOnLoad(entry: IntersectionObserverEntry): Stage {
  const { top, bottom } = entry.boundingClientRect;
  const scrolledPast = bottom <= 0;
  const alreadyPainted = top < window.innerHeight && !heldSinceFirstPaint(entry.target);
  if (scrolledPast || alreadyPainted) return "settled";
  return reached(entry) ? "cued" : "waiting";
}

function nextStage(stage: Stage, entry: IntersectionObserverEntry): Stage {
  if (stage === "undecided") return stageOnLoad(entry);
  return stage === "waiting" && reached(entry) ? "playing" : stage;
}

export function useFigurePlayback(card: RefObject<Element | null>) {
  const [stage, setStage] = useState<Stage>("undecided");
  const enabled = !usePrefersReducedMotion();

  useEffect(() => {
    const node = card.current;
    if (!enabled || !node) return;

    let latest: Stage = "undecided";
    const stopWatching = () => {
      for (const observer of observers) observer.disconnect();
    };
    const report: IntersectionObserverCallback = ([entry]) => {
      if (!entry) return;
      const next = nextStage(latest, entry);
      if (next === latest) return;
      latest = next;
      setStage(next);
      if (next !== "waiting") stopWatching();
    };
    const observers = [
      new IntersectionObserver(report, pastThePlayLine),
      new IntersectionObserver(report, whollyOnScreen),
    ];
    for (const observer of observers) observer.observe(node);
    return stopWatching;
  }, [card, enabled]);

  useEffect(() => {
    if (stage !== "cued") return;
    const frame = window.requestAnimationFrame(() => setStage("playing"));
    return () => window.cancelAnimationFrame(frame);
  }, [stage]);

  return {
    playback: enabled ? playbackAt[stage] : "static",
    held: enabled && stage === "undecided",
  };
}
