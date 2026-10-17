import { useSyncExternalStore } from "react";

import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  return useSyncExternalStore(subscribeToTheme, currentTheme, getServerSnapshot);
}
