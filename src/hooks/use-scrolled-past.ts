import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function getServerSnapshot() {
  return false;
}

export function useScrolledPast(offset: number) {
  return useSyncExternalStore(subscribe, () => window.scrollY > offset, getServerSnapshot);
}
