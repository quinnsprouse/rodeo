import { ink, Sticker, type StickerProps } from "@/components/stickers/frame";

export function TerminalSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-8}
      className={className}
      outline={<rect x="9" y="13" width="46" height="38" rx="10" />}
    >
      <rect x="9" y="13" width="46" height="38" rx="10" fill={ink.charcoal} />
      <path
        d="M20 25 L27.5 32 L20 39"
        fill="none"
        stroke={ink.lilac}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 39 H43" stroke={ink.white} strokeWidth={5} strokeLinecap="round" />
    </Sticker>
  );
}
