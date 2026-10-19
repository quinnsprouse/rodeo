import { useState, type ComponentType, type PointerEvent, type ReactNode, type Ref } from "react";

import type { StickerProps } from "@/components/stickers/frame";
import {
  CodebaseSticker,
  HumanReviewSticker,
  ProseSticker,
  StaticAnalysisSticker,
} from "@/components/stickers/topics";
import type { Entrance } from "@/hooks/use-entrance";
import { cn } from "@/lib/utils";

export const pyramidLayers: {
  name: string;
  detail: string;
  shape: string;
  fill: string;
  Sticker: ComponentType<StickerProps>;
}[] = [
  {
    name: "Codebase",
    detail: "One-way imports, theme tokens, server-only files.",
    shape:
      "M18.5 0 L301.5 0 A9 9 0 0 1 308.58 14.55 L282.7 47.55 A9 9 0 0 1 275.62 51 L44.38 51 A9 9 0 0 1 37.3 47.55 L11.42 14.55 A9 9 0 0 1 18.5 0 Z",
    fill: "fill-primary",
    Sticker: CodebaseSticker,
  },
  {
    name: "Static analysis",
    detail: "Most errors name the fix.",
    shape:
      "M58.5 67 L261.5 67 A9 9 0 0 1 268.58 81.55 L242.7 114.55 A9 9 0 0 1 235.62 118 L84.38 118 A9 9 0 0 1 77.3 114.55 L51.42 81.55 A9 9 0 0 1 58.5 67 Z",
    fill: "fill-primary/55",
    Sticker: StaticAnalysisSticker,
  },
  {
    name: "Prose",
    detail: "Short guides, read when needed.",
    shape:
      "M98.5 134 L221.5 134 A9 9 0 0 1 228.58 148.55 L202.7 181.55 A9 9 0 0 1 195.62 185 L124.38 185 A9 9 0 0 1 117.3 181.55 L91.42 148.55 A9 9 0 0 1 98.5 134 Z",
    fill: "fill-primary/25",
    Sticker: ProseSticker,
  },
  {
    name: "Human review",
    detail: "Whether the feature makes sense.",
    shape:
      "M138.5 201 L181.5 201 A9 9 0 0 1 188.58 215.55 L167.08 242.97 A9 9 0 0 1 152.92 242.97 L131.42 215.55 A9 9 0 0 1 138.5 201 Z",
    fill: "fill-neutral-4",
    Sticker: HumanReviewSticker,
  },
];

const layerSteps = ["delay-0", "delay-90", "delay-180", "delay-270"];

const focusMotion =
  "motion-safe:transition motion-safe:duration-(--motion-large-duration) motion-safe:ease-(--motion-large-easing)";

const sizes = {
  section: {
    root: "flex flex-col gap-xl sm:flex-row sm:items-start",
    pyramid: "w-full max-w-[320px]",
    list: "gap-m",
    row: "sm:h-[51px]",
    sticker: "size-9",
    name: "font-medium",
    detail: "text-s",
  },
  figure: {
    root: "flex flex-col items-center gap-l sm:flex-row sm:items-start sm:justify-center",
    pyramid: "w-[224px]",
    list: "gap-s sm:gap-[11.2px]",
    row: "sm:h-[35.7px]",
    sticker: "size-8",
    name: "text-s font-medium",
    detail: "text-xs",
  },
};

function entranceStyle(entrance: Entrance, index: number, hidden: string) {
  if (entrance === "waiting") return hidden;
  return entrance === "entering" ? layerSteps[index] : undefined;
}

function layerUnder(event: PointerEvent) {
  if (event.pointerType === "touch" || !(event.target instanceof Element)) return undefined;
  return event.target.closest("[data-layer]")?.getAttribute("data-layer") ?? undefined;
}

export function PyramidDiagram({
  ref,
  size,
  entrance,
  overlay,
  className,
}: {
  ref?: Ref<HTMLDivElement> | undefined;
  size: keyof typeof sizes;
  entrance: Entrance;
  overlay?: ReactNode;
  className?: string | undefined;
}) {
  const [focused, setFocused] = useState<string | null>(null);
  const style = sizes[size];

  return (
    <div
      ref={ref}
      onPointerOver={(event) => {
        const layer = layerUnder(event);
        if (layer) setFocused(layer);
      }}
      onPointerLeave={() => setFocused(null)}
      className={cn(style.root, className)}
    >
      <div className={cn("relative shrink-0", style.pyramid)}>
        <svg viewBox="0 0 320 252" aria-hidden="true" className="w-full">
          {pyramidLayers.map((layer, index) => (
            <path
              key={layer.name}
              d={layer.shape}
              data-layer={layer.name}
              className={cn(
                layer.fill,
                "origin-center transform-fill",
                focusMotion,
                focused && (focused === layer.name ? "scale-103" : "opacity-30 blur-xs"),
                entranceStyle(entrance, index, "-translate-y-2 scale-95 opacity-0 blur-xs"),
              )}
            />
          ))}
        </svg>
        {overlay}
      </div>

      <ol className={cn("flex flex-col", style.list)}>
        {pyramidLayers.map(({ name, detail, Sticker }, index) => (
          <li
            key={name}
            data-layer={name}
            className={cn(
              "flex items-center gap-s",
              style.row,
              focusMotion,
              focused && focused !== name && "opacity-40",
              entranceStyle(entrance, index, "translate-y-1.5 opacity-0 blur-xs"),
            )}
          >
            <Sticker
              className={cn(style.sticker, focusMotion, focused === name && "scale-110 -rotate-6")}
            />
            <div>
              <p className={cn("text-foreground", style.name)}>{name}</p>
              <p className={cn("text-pretty text-muted-foreground", style.detail)}>{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
