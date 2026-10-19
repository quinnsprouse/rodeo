import { useRef, useState, type ComponentType } from "react";

import { ArrowUpRight01Icon, Icon } from "@/components/icons";
import { PageSection } from "@/components/page-section";
import { entranceStyle, layerFocus, layerUnder, PyramidSlices } from "@/components/pyramid-slices";
import type { StickerProps } from "@/components/stickers/frame";
import {
  CodebaseSticker,
  HumanReviewSticker,
  ProseSticker,
  StaticAnalysisSticker,
} from "@/components/stickers/topics";
import { useEntrance } from "@/hooks/use-entrance";
import { usePlayOnView } from "@/hooks/use-play-on-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const layers: { name: string; detail: string; Sticker: ComponentType<StickerProps> }[] = [
  {
    name: "Codebase",
    detail: "One-way imports, theme tokens, server-only files.",
    Sticker: CodebaseSticker,
  },
  { name: "Static analysis", detail: "Most errors name the fix.", Sticker: StaticAnalysisSticker },
  { name: "Prose", detail: "Short guides, read when needed.", Sticker: ProseSticker },
  {
    name: "Human review",
    detail: "Whether the feature makes sense.",
    Sticker: HumanReviewSticker,
  },
];

export const pyramidSectionId = "how-it-works";

export function PyramidSection() {
  const [focused, setFocused] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const figure = useRef<HTMLDivElement>(null);
  const entrance = useEntrance(usePlayOnView(figure, !reducedMotion), 700);

  return (
    <PageSection id={pyramidSectionId}>
      <h2 className="font-brand text-l font-heavy text-foreground">
        Start with code you want the agent to copy.
      </h2>
      <p className="mt-s max-w-[520px] text-muted-foreground">
        Agents now write a lot of our code, and they learn by copying what's already there. Good
        patterns get repeated, and so do bad ones. The pyramid shows where a fix should live: the
        higher it sits, the less anyone has to repeat it. So Rodeo puts most of its work into the
        codebase and saves human review for what nothing else catches.
      </p>

      <div
        ref={figure}
        onPointerOver={(event) => {
          const layer = layerUnder(event);
          if (layer) setFocused(layer);
        }}
        onPointerLeave={() => setFocused(null)}
        className="mt-xl flex flex-col gap-xl sm:flex-row sm:items-start sm:gap-xl"
      >
        <PyramidSlices focused={focused} entrance={entrance} className="w-full max-w-[320px]" />

        <ol className="flex flex-col gap-m sm:gap-m">
          {layers.map(({ name, detail, Sticker }, index) => (
            <li
              key={name}
              data-layer={name}
              className={cn(
                "flex items-center gap-s sm:h-[51px]",
                layerFocus,
                focused && focused !== name && "opacity-40",
                entranceStyle(entrance, index, "translate-y-1.5 opacity-0 blur-xs"),
              )}
            >
              <Sticker
                className={cn("size-9", layerFocus, focused === name && "scale-110 -rotate-6")}
              />
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-s text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-xl text-s text-muted-foreground">
        Adapted from{" "}
        <a
          href="https://x.com/poteto/status/2111133080526495985"
          target="_blank"
          rel="noopener noreferrer"
          className="group/link inline-flex items-center gap-xxs text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground"
        >
          poteto's post on X
          <Icon
            icon={ArrowUpRight01Icon}
            className="size-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-safe:transition-transform motion-safe:duration-(--motion-duration) motion-safe:ease-(--motion-easing)"
            aria-hidden="true"
          />
        </a>
      </p>
    </PageSection>
  );
}
