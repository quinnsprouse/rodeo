export type Theme = "light" | "dark";
export type Canvas = "background" | "card";

const storageKey = "rodeo-theme";
const changeEvent = "rodeo-theme-change";
export const browserChrome: Record<Theme, Record<Canvas, string>> = {
  light: { background: "#ffffff", card: "#fafafa" },
  dark: { background: "#000000", card: "#202020" },
};

const systemDark = "(prefers-color-scheme: dark)";

export const themeInitScript = `try{var s=localStorage.getItem("${storageKey}");if(s?s==="dark":matchMedia("${systemDark}").matches){var r=document.documentElement;r.classList.add("dark");r.style.colorScheme="dark"}}catch(e){}`;

function storedTheme(): Theme | undefined {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "dark" || stored === "light" ? stored : undefined;
  } catch {
    return undefined;
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    return;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.dispatchEvent(new Event(changeEvent));
}

function snapToTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-snap");
  applyTheme(theme);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove("theme-snap"));
  });
}

function applyThemeInOneStep(theme: Theme) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion && "startViewTransition" in document) {
    document.startViewTransition(() => applyTheme(theme));
    return;
  }
  snapToTheme(theme);
}

function followOtherTabs(event: StorageEvent) {
  if (event.key !== storageKey) return;
  applyTheme(event.newValue === "dark" ? "dark" : "light");
}

function followSystem(event: MediaQueryListEvent) {
  const theme = event.matches ? "dark" : "light";
  if (storedTheme() || currentTheme() === theme) return;
  snapToTheme(theme);
}

export function setTheme(theme: Theme) {
  storeTheme(theme);
  applyThemeInOneStep(theme);
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function subscribeToTheme(onChange: () => void) {
  const system = window.matchMedia(systemDark);
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", followOtherTabs);
  system.addEventListener("change", followSystem);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", followOtherTabs);
    system.removeEventListener("change", followSystem);
  };
}
