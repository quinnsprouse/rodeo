import type { Entrance } from "@/hooks/use-entrance";
import { cn } from "@/lib/utils";

export const pyramidSlices = [
  {
    name: "Codebase",
    shape:
      "M18.5 0 L301.5 0 A9 9 0 0 1 308.58 14.55 L282.7 47.55 A9 9 0 0 1 275.62 51 L44.38 51 A9 9 0 0 1 37.3 47.55 L11.42 14.55 A9 9 0 0 1 18.5 0 Z",
    fill: "fill-primary",
  },
  {
    name: "Static analysis",
    shape:
      "M58.5 67 L261.5 67 A9 9 0 0 1 268.58 81.55 L242.7 114.55 A9 9 0 0 1 235.62 118 L84.38 118 A9 9 0 0 1 77.3 114.55 L51.42 81.55 A9 9 0 0 1 58.5 67 Z",
    fill: "fill-primary/55",
  },
  {
    name: "Prose",
    shape:
      "M98.5 134 L221.5 134 A9 9 0 0 1 228.58 148.55 L202.7 181.55 A9 9 0 0 1 195.62 185 L124.38 185 A9 9 0 0 1 117.3 181.55 L91.42 148.55 A9 9 0 0 1 98.5 134 Z",
    fill: "fill-primary/25",
  },
  {
    name: "Human review",
    shape:
      "M138.5 201 L181.5 201 A9 9 0 0 1 188.58 215.55 L167.08 242.97 A9 9 0 0 1 152.92 242.97 L131.42 215.55 A9 9 0 0 1 138.5 201 Z",
    fill: "fill-neutral-4",
  },
] as const;

const layerSteps = ["delay-0", "delay-90", "delay-180", "delay-270"];

export function entranceStyle(entrance: Entrance, index: number, hidden: string) {
  if (entrance === "waiting") return hidden;
  return entrance === "entering" ? layerSteps[index] : undefined;
}

export const layerFocus =
  "motion-safe:transition motion-safe:duration-(--motion-large-duration) motion-safe:ease-(--motion-large-easing)";

export function PyramidSlices({
  focused,
  entrance = "settled",
  className,
}: {
  focused?: string | null | undefined;
  entrance?: Entrance | undefined;
  className?: string | undefined;
}) {
  return (
    <svg viewBox="0 0 320 252" aria-hidden="true" className={cn("shrink-0", className)}>
      {pyramidSlices.map((slice, index) => (
        <path
          key={slice.name}
          d={slice.shape}
          data-layer={slice.name}
          className={cn(
            slice.fill,
            "origin-center transform-fill",
            layerFocus,
            focused && (focused === slice.name ? "scale-103" : "opacity-30 blur-xs"),
            entranceStyle(entrance, index, "-translate-y-2 scale-95 opacity-0 blur-xs"),
          )}
        />
      ))}
    </svg>
  );
}
