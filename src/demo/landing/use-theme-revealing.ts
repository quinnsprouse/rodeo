import { useSyncExternalStore } from "react";

function subscribeToRootClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
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
  return useSyncExternalStore(subscribeToRootClass, themeRevealing, getServerSnapshot);
}
