import { useCallback } from "react";

export interface AnimationTiming {
  duration: number;
  delay: number;
  start?: Record<string, string>;
}

function settledValues(keyframes: PropertyIndexedKeyframes) {
  const values: Record<string, string> = {};
  for (const [property, frames] of Object.entries(keyframes)) {
    if (!Array.isArray(frames) || frames.some((frame) => frame !== frames[0])) return undefined;
    values[property] = String(frames[0]);
  }
  return values;
}

export function useWebAnimation(keyframes: PropertyIndexedKeyframes, timing: AnimationTiming) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return undefined;
      const settled = settledValues(keyframes);
      for (const [property, value] of Object.entries({ ...timing.start, ...settled })) {
        node.style.setProperty(property, value);
      }
      if (settled) return undefined;
      const animation = node.animate(keyframes, {
        duration: timing.duration,
        delay: timing.delay,
        easing: "linear",
        fill: "both",
      });
      return () => animation.cancel();
    },
    [keyframes, timing],
  );
}
