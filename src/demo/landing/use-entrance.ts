import { useEffect, useState } from "react";

import type { Playback } from "@/hooks/use-play-on-view";

export type Entrance = "waiting" | "entering" | "settled";

export function useEntrance(playback: Playback, duration: number): Entrance {
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (playback !== "playing") return;
    const timer = window.setTimeout(() => setFinished(true), duration);
    return () => window.clearTimeout(timer);
  }, [playback, duration]);

  if (playback === "waiting") return "waiting";
  return playback === "playing" && !finished ? "entering" : "settled";
}
