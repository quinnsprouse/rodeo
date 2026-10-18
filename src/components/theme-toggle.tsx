import type { MouseEvent } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { playSound, preloadSounds } from "@/lib/sound";
import { setTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
const rays = rayAngles.map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return { degrees, cx: 10 + Math.cos(radians) * 7.54, cy: 10 + Math.sin(radians) * 7.54 };
});

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
      {rays.map((ray) => (
        <circle key={ray.degrees} cx={ray.cx} cy={ray.cy} r="1.4" fill="currentColor" />
      ))}
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.5 11.8A7 7 0 1 1 8.2 3.5a5.6 5.6 0 0 0 8.3 8.3Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const iconLayer =
  "absolute inset-0 flex items-center justify-center transition duration-(--motion-large-duration) ease-(--motion-large-easing)";

export function ThemeToggle({ className }: { className?: string | undefined }) {
  const theme = useTheme();
  const isDark = theme === "dark";

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    void playSound("click");
    const box = event.currentTarget.getBoundingClientRect();
    setTheme(isDark ? "light" : "dark", {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      onPointerEnter={() => preloadSounds(["click"])}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "size-10 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <span className="relative flex size-5 items-center justify-center">
        <span
          className={cn(
            iconLayer,
            "dark:opacity-0 motion-safe:dark:scale-40 motion-safe:dark:rotate-90 motion-safe:dark:blur-xs",
          )}
        >
          <SunIcon />
        </span>
        <span
          className={cn(
            iconLayer,
            "opacity-0 motion-safe:scale-40 motion-safe:-rotate-90 motion-safe:blur-xs dark:opacity-100 motion-safe:dark:scale-100 motion-safe:dark:rotate-0 motion-safe:dark:blur-none",
          )}
        >
          <MoonIcon />
        </span>
      </span>
    </button>
  );
}
