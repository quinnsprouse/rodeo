import { useEffect, useState } from "react";

import type { Playback } from "@/hooks/use-play-on-view";

export function useBeats(delays: readonly number[], playback: Playback) {
  const [beat, setBeat] = useState(-1);
  const last = delays.length - 1;
  const delay = delays[beat + 1] ?? 0;

  useEffect(() => {
    if (playback !== "playing" || beat >= last) return;
    const timer = window.setTimeout(() => setBeat((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [playback, beat, last, delay]);

  if (playback === "static") return last;
  if (playback === "waiting") return -1;
  return beat;
}
