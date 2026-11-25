import { Sticker, type StickerProps } from "@/components/stickers/frame";
import { ink } from "@/demo/stickers/ink";

export function LighthouseSticker({ className }: StickerProps) {
  const tower = "M17 30 H29 L31.5 54 H14.5 Z";
  const rays = "M23 4.5 V8.5 M14.8 7.9 L17.6 10.7 M31.2 7.9 L28.4 10.7";
  return (
    <Sticker
      tilt={5}
      className={className}
      outline={
        <>
          <circle cx="23" cy="12.5" r="8.5" />
          <rect x="13.5" y="17" width="19" height="13.5" rx="2.25" />
          <path d={tower} />
          <rect x="11" y="52.5" width="24" height="6" rx="3" />
          <circle cx="46" cy="46" r="10" />
        </>
      }
    >
      <path d={rays} fill="none" stroke={ink.orange} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M17.5 18 A5.5 5.5 0 0 1 28.5 18 Z" fill={ink.orange} />
      <rect x="16.5" y="19" width="13" height="8" fill={ink.purple} />
      <rect x="17.8" y="21.4" width="2.6" height="4.2" rx="0.8" fill={ink.lavender} />
      <rect x="21.4" y="21.4" width="3.2" height="4.2" rx="0.8" fill={ink.lavender} />
      <rect x="25.6" y="21.4" width="2.6" height="4.2" rx="0.8" fill={ink.lavender} />
      <rect x="14.5" y="17" width="17" height="4" rx="2" fill={ink.purple} />
      <path d={tower} fill={ink.lilac} />
      <path d="M16.27 37 H29.73 L30.46 44 H15.54 Z" fill={ink.purple} />
      <path d="M21 37 V34.5 A2 2 0 0 1 25 34.5 V37 Z" fill={ink.charcoal} />
      <rect x="13.5" y="26" width="19" height="4.5" rx="2.25" fill={ink.purple} />
      <path d="M14.92 50 H31.08 L31.5 54 H14.5 Z" fill={ink.purple} />
      <rect x="11" y="52.5" width="24" height="6" rx="3" fill={ink.purple} />
      <circle cx="46" cy="46" r="10" fill={ink.green} />
      <path
        d="M41 46.5 L44.5 50 L51.5 42.5"
        fill="none"
        stroke={ink.charcoal}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Sticker>
  );
}

export function WebMcpSticker({ className }: StickerProps) {
  const robot = (
    <>
      <rect x="16" y="45" width="6" height="9" rx="3" />
      <rect x="42" y="45" width="6" height="9" rx="3" />
      <rect x="30.75" y="31" width="2.5" height="8" />
      <circle cx="32" cy="29.5" r="3.2" />
      <rect x="19" y="38" width="26" height="21" rx="7.5" />
    </>
  );
  return (
    <Sticker
      tilt={-6}
      className={className}
      outline={
        <>
          <rect x="6" y="7" width="52" height="37" rx="7" />
          {robot}
        </>
      }
    >
      <rect x="6" y="7" width="52" height="37" rx="7" fill={ink.paper} />
      <path d="M6 14 A7 7 0 0 1 13 7 H51 A7 7 0 0 1 58 14 V17 H6 Z" fill={ink.charcoal} />
      <circle cx="12.5" cy="12" r="2" fill={ink.orange} />
      <circle cx="18.5" cy="12" r="2" fill={ink.green} />
      <circle cx="24.5" cy="12" r="2" fill={ink.lilac} />
      <rect x="11" y="21.5" width="20" height="14" rx="3" fill={ink.lavender} />
      <rect x="35" y="21.5" width="18" height="3.5" rx="1.75" fill={ink.lilac} />
      <rect x="35" y="28" width="18" height="3.5" rx="1.75" fill={ink.lilac} />
      <g fill={ink.white} stroke={ink.white} strokeWidth={3} strokeLinejoin="round">
        {robot}
      </g>
      <rect x="16" y="45" width="6" height="9" rx="3" fill={ink.lilac} />
      <rect x="42" y="45" width="6" height="9" rx="3" fill={ink.lilac} />
      <rect x="30.75" y="31" width="2.5" height="8" fill={ink.purple} />
      <circle cx="32" cy="29.5" r="3.2" fill={ink.lilac} />
      <rect x="19" y="38" width="26" height="21" rx="7.5" fill={ink.purple} />
      <circle cx="26.5" cy="48.5" r="4.2" fill={ink.white} />
      <circle cx="37.5" cy="48.5" r="4.2" fill={ink.white} />
      <circle cx="26.5" cy="48.5" r="2.1" fill={ink.charcoal} />
      <circle cx="37.5" cy="48.5" r="2.1" fill={ink.charcoal} />
    </Sticker>
  );
}
