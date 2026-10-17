import { ink, Sticker, type StickerProps } from "./frame";

export function TokenSticker({ className }: StickerProps) {
  return (
    <Sticker tilt={-10} className={className} outline={<circle cx="33" cy="33.5" r="23.5" />}>
      <circle cx="34.5" cy="35" r="22" fill="#d6930f" />
      <circle cx="32" cy="32" r="22" fill="#f7c33f" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#e3a51e" strokeWidth={2.5} />
      <path
        d="M32 22 C33 29 35 31 42 32 C35 33 33 35 32 42 C31 35 29 33 22 32 C29 31 31 29 32 22 Z"
        fill="#e3a51e"
      />
      <path
        d="M16 27 A16.5 16.5 0 0 1 26 15.5"
        fill="none"
        stroke={ink.white}
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    </Sticker>
  );
}

export function ScissorsSticker({ className }: StickerProps) {
  const back =
    "M24 41 C25 37 27 34 30 31 L46 8 C47.5 6 50.5 7.5 49.5 9.5 L36 34 C34 37 31 40 29 43 Z";
  const front =
    "M40 41 C39 37 37 34 34 31 L18 8 C16.5 6 13.5 7.5 14.5 9.5 L28 34 C30 37 33 40 35 43 Z";
  return (
    <Sticker
      tilt={14}
      className={className}
      outline={
        <>
          <path d={back} />
          <path d={front} />
          <circle cx="19" cy="50" r="9" />
          <circle cx="45" cy="50" r="9" />
        </>
      }
    >
      <path d={back} fill="#b5b5b5" />
      <circle cx="45" cy="50" r="9" fill="#6a1fe0" />
      <circle cx="45" cy="50" r="4.2" fill={ink.white} />
      <path d={front} fill="#e6e6e6" />
      <path
        d="M18 8 L28.5 33"
        fill="none"
        stroke={ink.white}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.8}
      />
      <circle cx="19" cy="50" r="9" fill={ink.purple} />
      <circle cx="19" cy="50" r="4.2" fill={ink.white} />
      <circle cx="32" cy="32" r="3.4" fill={ink.charcoal} />
      <circle cx="31" cy="31" r="1" fill={ink.white} opacity={0.6} />
    </Sticker>
  );
}

export function HeartSticker({ className }: StickerProps) {
  const heart =
    "M32 54 C 12 40, 7 28, 13 19 C 19 11, 29 12, 32 21 C 35 12, 45 11, 51 19 C 57 28, 52 40, 32 54 Z";
  return (
    <Sticker tilt={-8} className={className} outline={<path d={heart} />}>
      <path d={heart} fill={ink.red} />
      <path
        d="M17 24 C 18 20, 21 18, 24 18"
        fill="none"
        stroke={ink.white}
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={0.7}
      />
    </Sticker>
  );
}
