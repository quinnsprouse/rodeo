import { useEffect, useState } from "react";

import type { Playback } from "@/hooks/use-play-on-view";

const leadIn = 150;

export function useBeats(durations: readonly number[], playback: Playback) {
  const [beat, setBeat] = useState(-1);
  const end = durations.length;
  const delay = beat < 0 ? leadIn : (durations[beat] ?? 0);

  useEffect(() => {
    if (playback !== "playing" || beat >= end) return;
    const timer = window.setTimeout(() => setBeat((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [playback, beat, end, delay]);

  if (playback === "static") return end;
  if (playback === "waiting") return -1;
  return beat;
}
