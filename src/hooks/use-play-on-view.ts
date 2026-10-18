import { useEffect, useState, type RefObject } from "react";

export type Playback = "static" | "waiting" | "playing";

export function usePlayOnView(ref: RefObject<Element | null>, enabled: boolean): Playback {
  const [playback, setPlayback] = useState<Playback>("static");

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;

    let firstReport = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (firstReport) {
          firstReport = false;
          if (entry.boundingClientRect.top < window.innerHeight) {
            observer.disconnect();
            return;
          }
          setPlayback("waiting");
        }
        if (entry.isIntersecting) {
          setPlayback("playing");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, enabled]);

  return enabled ? playback : "static";
}
