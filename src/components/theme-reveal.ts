import { useSyncExternalStore } from "react";

import { applyTheme, snapToTheme, type Theme } from "@/lib/theme";

interface RevealOrigin {
  x: number;
  y: number;
}

const revealDuration = 600;
const revealEasing = "cubic-bezier(0.645, 0.045, 0.355, 1)";
const revealSettle = 40;
const subscribers = new Set<() => void>();
let latestReveal: ViewTransition | undefined;

function setRevealing(revealing: boolean) {
  document.documentElement.classList.toggle("theme-reveal", revealing);
  for (const notify of subscribers) notify();
}

function growCircle({ x, y }: RevealOrigin) {
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
    {
      duration: revealDuration,
      easing: revealEasing,
      delay: revealSettle,
      fill: "both",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

export function revealTheme(theme: Theme, origin: RevealOrigin, reducedMotion: boolean) {
  if (reducedMotion || !("startViewTransition" in document)) {
    snapToTheme(theme);
    return;
  }

  const transition = document.startViewTransition(() => {
    const root = document.documentElement;
    root.style.setProperty("--reveal-x", `${origin.x}px`);
    root.style.setProperty("--reveal-y", `${origin.y}px`);
    setRevealing(true);
    applyTheme(theme);
  });
  void transition.ready.then(
    () => growCircle(origin),
    () => undefined,
  );
  latestReveal = transition;
  void transition.finished.finally(() => {
    if (latestReveal !== transition) return;
    setRevealing(false);
    latestReveal = undefined;
  });
}

function subscribeToReveal(onChange: () => void) {
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
}

function themeRevealing() {
  return document.documentElement.classList.contains("theme-reveal");
}

function getServerSnapshot() {
  return false;
}

// why: During a view transition, Chrome repaints every moving element in the live new view on
// each frame, so motion pauses while the circle grows.
export function useThemeRevealing() {
  return useSyncExternalStore(subscribeToReveal, themeRevealing, getServerSnapshot);
}
