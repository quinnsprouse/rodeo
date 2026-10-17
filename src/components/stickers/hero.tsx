import { ink, Sticker, type StickerProps } from "./frame";

const horns = [
  "M20 24 C 13 24, 7 20, 6 12 C 10 16, 15 17, 21 17 Z",
  "M44 24 C 51 24, 57 20, 58 12 C 54 16, 49 17, 43 17 Z",
];
const head =
  "M20 17 C 26 14, 38 14, 44 17 C 47 25, 46 33, 43 40 C 40 47, 24 47, 21 40 C 18 33, 17 25, 20 17 Z";
const shadedHalf =
  "M32 15.2 C 38 15.2, 41.5 15.8, 44 17 C 47 25, 46 33, 43 40 C 40.5 45.5, 36 46.5, 32 46.5 Z";

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

export function BullSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-6}
      className={className}
      outline={
        <>
          {horns.map((horn) => (
            <path key={horn} d={horn} />
          ))}
          <path d={head} />
          <ellipse cx="32" cy="43" rx="11" ry="7.5" />
        </>
      }
    >
      {horns.map((horn) => (
        <path
          key={horn}
          d={horn}
          fill={ink.lavender}
          stroke={ink.lavender}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
      <path d={head} fill={ink.purple} />
      <path d={shadedHalf} fill="#7430e6" />
      <ellipse cx="32" cy="43" rx="11" ry="7.5" fill={ink.lilac} />
      <ellipse cx="27.5" cy="43" rx="1.8" ry="2.4" fill="#6a1fe0" />
      <ellipse cx="36.5" cy="43" rx="1.8" ry="2.4" fill="#6a1fe0" />
      <circle cx="25.5" cy="29" r="2.4" fill={ink.charcoal} />
      <circle cx="38.5" cy="29" r="2.4" fill={ink.charcoal} />
      <circle cx="24.8" cy="28.2" r="0.8" fill={ink.white} />
      <circle cx="37.8" cy="28.2" r="0.8" fill={ink.white} />
    </Sticker>
  );
}
