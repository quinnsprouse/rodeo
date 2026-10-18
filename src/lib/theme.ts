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

export interface RevealOrigin {
  x: number;
  y: number;
}

const revealDuration = 600;
const revealEasing = "cubic-bezier(0.645, 0.045, 0.355, 1)";
const revealSettle = 40;
const revealEvent = "rodeo-theme-reveal";
let latestReveal: ViewTransition | undefined;

function setRevealing(revealing: boolean) {
  document.documentElement.classList.toggle("theme-snap", revealing);
  document.documentElement.classList.toggle("theme-reveal", revealing);
  window.dispatchEvent(new Event(revealEvent));
}

function revealFrom({ x, y }: RevealOrigin) {
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

function applyThemeInOneStep(theme: Theme, origin: RevealOrigin | undefined) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !origin || !("startViewTransition" in document)) {
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
    () => revealFrom(origin),
    () => undefined,
  );
  latestReveal = transition;
  void transition.finished.finally(() => {
    if (latestReveal !== transition) return;
    setRevealing(false);
    latestReveal = undefined;
  });
}

export function themeRevealing() {
  return document.documentElement.classList.contains("theme-reveal");
}

export function subscribeToReveal(onChange: () => void) {
  window.addEventListener(revealEvent, onChange);
  return () => window.removeEventListener(revealEvent, onChange);
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

export function setTheme(theme: Theme, origin?: RevealOrigin) {
  storeTheme(theme);
  applyThemeInOneStep(theme, origin);
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
