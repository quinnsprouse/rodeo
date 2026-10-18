import type { RefObject } from "react";

import { usePlayOnView, type Playback } from "@/hooks/use-play-on-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function useScrollPlayback(ref: RefObject<Element | null>): Playback {
  const reducedMotion = usePrefersReducedMotion();
  return usePlayOnView(ref, !reducedMotion);
}
