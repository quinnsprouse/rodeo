export type Theme = "light" | "dark";

interface CanvasColors {
  body: string | undefined;
  chrome: Record<Theme, string>;
}

export const canvases = {
  background: { body: undefined, chrome: { light: "#ffffff", dark: "#000000" } },
  card: { body: "bg-card", chrome: { light: "#fafafa", dark: "#202020" } },
} satisfies Record<string, CanvasColors>;

export type Canvas = keyof typeof canvases;

const storageKey = "rodeo-theme";
const systemDark = "(prefers-color-scheme: dark)";

function themeFromStorage(key: string, darkQuery: string): Theme {
  let stored: string | null;
  try {
    stored = localStorage.getItem(key);
  } catch {
    stored = null;
  }
  if (stored === "dark" || stored === "light") return stored;
  return matchMedia(darkQuery).matches ? "dark" : "light";
}

function writeTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export const themeInitScript = `try{var t=(${String(themeFromStorage)})(${JSON.stringify(storageKey)},${JSON.stringify(systemDark)});t==="dark"&&(${String(writeTheme)})(t)}catch(e){}`;

const subscribers = new Set<() => void>();

export function applyTheme(theme: Theme) {
  writeTheme(theme);
  for (const notify of subscribers) notify();
}

export function snapToTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-snap");
  applyTheme(theme);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove("theme-snap"));
  });
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function subscribeToTheme(onChange: () => void) {
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
}

export function setTheme(theme: Theme, apply: (theme: Theme) => void = snapToTheme) {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // why: localStorage throws when the browser blocks site storage, and the theme should
    // still apply to this page.
  }
  apply(theme);
}

function storedOrSystemTheme() {
  return themeFromStorage(storageKey, systemDark);
}

function followSystem() {
  const theme = storedOrSystemTheme();
  if (theme !== currentTheme()) snapToTheme(theme);
}

function followOtherTabs(event: StorageEvent) {
  if (event.key === storageKey) applyTheme(storedOrSystemTheme());
}

function followSystemAndOtherTabs() {
  window.matchMedia(systemDark).addEventListener("change", followSystem);
  window.addEventListener("storage", followOtherTabs);
}

if (typeof window !== "undefined") followSystemAndOtherTabs();
