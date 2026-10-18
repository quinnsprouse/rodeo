import { useSyncExternalStore } from "react";

import { subscribeToReveal, themeRevealing } from "@/lib/theme";

function getServerSnapshot() {
  return false;
}

export function useThemeRevealing() {
  return useSyncExternalStore(subscribeToReveal, themeRevealing, getServerSnapshot);
}
