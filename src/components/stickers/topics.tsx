import { ink, Sticker, type StickerProps } from "./frame";

export function CodebaseSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-8}
      className={className}
      outline={
        <>
          <rect x="18" y="6" width="38" height="42" rx="7" />
          <rect x="7" y="16" width="44" height="40" rx="8" />
        </>
      }
    >
      <rect x="18" y="6" width="38" height="42" rx="7" fill={ink.purple} />
      <rect x="38" y="10.5" width="12" height="4" rx="2" fill={ink.lavender} />
      <rect x="7" y="16" width="44" height="40" rx="8" fill={ink.charcoal} />
      <rect x="14" y="25" width="14" height="5" rx="2.5" fill={ink.lilac} />
      <rect x="31" y="25" width="12" height="5" rx="2.5" fill={ink.orange} />
      <rect x="20" y="34" width="21" height="5" rx="2.5" fill={ink.paper} />
      <rect x="20" y="43" width="11" height="5" rx="2.5" fill={ink.green} />
    </Sticker>
  );
}

export function StaticAnalysisSticker({ className }: StickerProps) {
  const shield = "M32 7 L51 14 V30 C51 42.5 43 51.5 32 57 C21 51.5 13 42.5 13 30 V14 Z";
  return (
    <Sticker tilt={7} className={className} outline={<path d={shield} />}>
      <path
        d={shield}
        fill={ink.purple}
        stroke={ink.purple}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M32 7 L51 14 V30 C51 42.5 43 51.5 32 57 Z" fill="#7430e6" />
      <path
        d="M23 31.5 L29.5 38 L41.5 25"
        fill="none"
        stroke={ink.white}
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Sticker>
  );
}

export function ProseSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-6}
      className={className}
      outline={<rect x="12" y="6" width="40" height="52" rx="7" />}
    >
      <rect x="12" y="6" width="40" height="52" rx="7" fill={ink.paper} />
      <rect x="19" y="15" width="15" height="5" rx="2.5" fill={ink.purple} />
      {[
        [26, 26],
        [33, 21],
        [40, 25],
        [47, 13],
      ].map(([y, width]) => (
        <rect key={y} x="19" y={y} width={width} height="3.5" rx="1.75" fill={ink.line} />
      ))}
      <path d="M38 6 H46 V23 L42 19.5 L38 23 Z" fill={ink.orange} />
    </Sticker>
  );
}

export function HumanReviewSticker({ className }: StickerProps) {
  const eye = "M5 32 C13 19 22 13 32 13 C42 13 51 19 59 32 C51 45 42 51 32 51 C22 51 13 45 5 32 Z";
  return (
    <Sticker tilt={-9} className={className} outline={<path d={eye} />}>
      <path
        d={eye}
        fill={ink.paper}
        stroke={ink.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="12" fill={ink.charcoal} />
      <circle cx="36.5" cy="27.5" r="3.5" fill={ink.white} />
    </Sticker>
  );
}

export function BrowserTestsSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={6}
      className={className}
      outline={<rect x="6" y="10" width="52" height="44" rx="8" />}
    >
      <rect x="6" y="10" width="52" height="44" rx="8" fill={ink.paper} />
      <path d="M6 18 A8 8 0 0 1 14 10 H50 A8 8 0 0 1 58 18 V22 H6 Z" fill={ink.charcoal} />
      <circle cx="13.5" cy="16" r="2.2" fill={ink.red} />
      <circle cx="20" cy="16" r="2.2" fill={ink.orange} />
      <circle cx="26.5" cy="16" r="2.2" fill={ink.green} />
      <circle cx="32" cy="38" r="10" fill={ink.green} />
      <path
        d="M27 38.5 L30.5 42 L37.5 34.5"
        fill="none"
        stroke={ink.charcoal}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Sticker>
  );
}

export function LintRulesSticker({ className }: StickerProps) {
  const flag = "M19 10 H52 L44 21.5 L52 33 H19 Z";
  return (
    <Sticker
      tilt={-5}
      className={className}
      outline={
        <>
          <rect x="13" y="6" width="6" height="52" rx="3" />
          <path d={flag} />
        </>
      }
    >
      <path d={flag} fill={ink.red} stroke={ink.red} strokeWidth={2} strokeLinejoin="round" />
      <rect x="19" y="10" width="6" height="23" fill="#e8404f" />
      <rect x="13" y="6" width="6" height="52" rx="3" fill={ink.charcoal} />
    </Sticker>
  );
}

export function ShortDocsSticker({ className }: StickerProps) {
  const note = "M15 9 H49 A6 6 0 0 1 55 15 V41 L41 55 H15 A6 6 0 0 1 9 49 V15 A6 6 0 0 1 15 9 Z";
  return (
    <Sticker tilt={8} className={className} outline={<path d={note} />}>
      <path d={note} fill={ink.lavender} />
      <path d="M55 41 L41 55 V47 A6 6 0 0 1 47 41 Z" fill={ink.lilac} />
      <rect x="17" y="19" width="24" height="5" rx="2.5" fill={ink.purple} />
      <rect x="17" y="29" width="15" height="5" rx="2.5" fill={ink.lilac} />
    </Sticker>
  );
}

export function DesignSystemSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-7}
      className={className}
      outline={<rect x="8" y="8" width="48" height="48" rx="10" />}
    >
      <rect x="8" y="8" width="22" height="22" rx="7" fill={ink.purple} />
      <rect x="34" y="8" width="22" height="22" rx="7" fill={ink.lilac} />
      <rect x="8" y="34" width="22" height="22" rx="7" fill={ink.lavender} />
      <rect x="34" y="34" width="22" height="22" rx="7" fill={ink.charcoal} />
      <circle cx="45" cy="45" r="4.5" fill={ink.orange} />
    </Sticker>
  );
}

export function OneWaySticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={5}
      className={className}
      outline={
        <>
          <rect x="5" y="13" width="54" height="26" rx="6" />
          <rect x="29" y="39" width="6" height="19" rx="2" />
        </>
      }
    >
      <rect x="29" y="36" width="6" height="22" rx="2" fill={ink.slate} />
      <rect x="5" y="13" width="54" height="26" rx="6" fill={ink.charcoal} />
      <rect x="12" y="23.5" width="29" height="5" rx="2.5" fill={ink.white} />
      <path
        d="M38 18.5 L51 26 L38 33.5 Z"
        fill={ink.white}
        stroke={ink.white}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Sticker>
  );
}
