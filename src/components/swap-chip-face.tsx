import type { ComponentType } from "react";

import type { StickerProps } from "@/components/stickers/frame";

export interface SwapChoice {
  word: string;
  Sticker: ComponentType<StickerProps>;
  swing: 1 | -1;
}

export const stickerWindow =
  "relative size-[1.45em] shrink-0 transition-transform duration-(--motion-large-duration) ease-(--motion-large-easing) md:size-[1.6em] motion-safe:group-hover/chip:-rotate-6 motion-safe:group-hover/chip:scale-110";

export function StaticChipFace({ choice }: { choice: SwapChoice }) {
  const { Sticker } = choice;
  return (
    <>
      <span className={stickerWindow} aria-hidden="true">
        <Sticker className="absolute inset-0 size-full" />
      </span>
      <span>{choice.word}</span>
    </>
  );
}
