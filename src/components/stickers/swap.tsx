import { cn } from "@/lib/utils";

import { ink, Sticker, type StickerProps } from "./frame";

const blocked = (
  <>
    <circle cx="48" cy="48" r="10" fill={ink.red} />
    <rect x="42" y="45.75" width="12" height="4.5" rx="2.25" fill={ink.white} />
  </>
);

export function EditSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-38}
      className={className}
      outline={
        <>
          <rect x="6" y="24" width="40" height="16" rx="5" />
          <path d="M45 24 L58 32 L45 40 Z" />
        </>
      }
    >
      <path d="M45 24 L58 32 L45 40 Z" fill={ink.paper} stroke={ink.paper} strokeLinejoin="round" />
      <path d="M53.5 28.8 L58 32 L53.5 35.2 Z" fill={ink.charcoal} />
      <rect x="6" y="24" width="12" height="16" rx="5" fill={ink.red} />
      <rect x="14" y="24" width="7" height="16" fill={ink.line} />
      <rect x="21" y="24" width="25" height="16" fill={ink.orange} />
      <rect x="21" y="30.5" width="25" height="3" fill={ink.white} opacity={0.35} />
    </Sticker>
  );
}

export function CommitSticker({ className }: StickerProps) {
  const disk = "M9 14 A5 5 0 0 1 14 9 H45 L55 19 V50 A5 5 0 0 1 50 55 H14 A5 5 0 0 1 9 50 Z";
  return (
    <Sticker tilt={8} className={className} outline={<path d={disk} />}>
      <path d={disk} fill={ink.purple} />
      <rect x="19" y="9" width="24" height="15" rx="2" fill={ink.silver} />
      <rect x="34" y="12" width="5" height="9" rx="1.5" fill={ink.purple} />
      <rect x="16" y="32" width="32" height="23" rx="3" fill={ink.paper} />
      <rect x="21" y="38" width="18" height="3.5" rx="1.75" fill={ink.line} />
      <rect x="21" y="45" width="12" height="3.5" rx="1.75" fill={ink.line} />
    </Sticker>
  );
}

export function PushSticker({ className }: StickerProps) {
  const body = "M32 5 C41 12 44 22 44 33 V45 H20 V33 C20 22 23 12 32 5 Z";
  const leftFin = "M20 32 L11 43 V51 L20 46 Z";
  const rightFin = "M44 32 L53 43 V51 L44 46 Z";
  const flame = "M24 45 H40 L36 53 L32 60 L28 53 Z";
  return (
    <Sticker
      tilt={38}
      scale={0.9}
      className={className}
      outline={
        <>
          <path d={body} />
          <path d={leftFin} />
          <path d={rightFin} />
          <path d={flame} />
        </>
      }
    >
      <path d={flame} fill={ink.orange} stroke={ink.orange} strokeLinejoin="round" />
      <path d={leftFin} fill={ink.purple} stroke={ink.purple} strokeLinejoin="round" />
      <path d={rightFin} fill={ink.purple} stroke={ink.purple} strokeLinejoin="round" />
      <path d={body} fill={ink.paper} />
      <path d="M32 5 C36.5 8.5 39.5 12.5 41.3 17 H22.7 C24.5 12.5 27.5 8.5 32 5 Z" fill={ink.red} />
      <circle cx="32" cy="29" r="6.5" fill={ink.white} />
      <circle cx="32" cy="29" r="4.5" fill={ink.lilac} />
      <rect x="20" y="40" width="24" height="5" fill={ink.silver} />
    </Sticker>
  );
}

export function CommentSticker({ className }: StickerProps) {
  return (
    <Sticker
      tilt={-8}
      className={className}
      outline={
        <>
          <rect x="6" y="9" width="46" height="34" rx="10" />
          <path d="M15 40 L13 52 L27 41 Z" />
          <circle cx="48" cy="48" r="10" />
        </>
      }
    >
      <path d="M15 40 L13 52 L27 41 Z" fill={ink.charcoal} stroke={ink.charcoal} />
      <rect x="6" y="9" width="46" height="34" rx="10" fill={ink.charcoal} />
      <rect x="14" y="18" width="24" height="4.5" rx="2.25" fill={ink.slate} />
      <rect x="14" y="27" width="15" height="4.5" rx="2.25" fill={ink.slate} />
      {blocked}
    </Sticker>
  );
}

export function DeadCodeSticker({ className }: StickerProps) {
  const ghost = "M12 55 V30 A19 19 0 0 1 50 30 V55 L43.7 50 L37.3 55 L31 50 L24.7 55 L18.3 50 Z";
  return (
    <Sticker
      tilt={-7}
      className={className}
      outline={
        <>
          <path d={ghost} />
          <circle cx="48" cy="48" r="10" />
        </>
      }
    >
      <path d={ghost} fill={ink.lavender} stroke={ink.lavender} strokeLinejoin="round" />
      <rect x="21" y="26" width="7" height="10" rx="3.5" fill={ink.charcoal} />
      <rect x="33" y="26" width="7" height="10" rx="3.5" fill={ink.charcoal} />
      {blocked}
    </Sticker>
  );
}

export function OffBrandSticker({ className }: StickerProps) {
  const chip = { x: 10, y: 7, width: 14, height: 47, rx: 5 };
  return (
    <Sticker
      tilt={-4}
      className={className}
      outline={
        <>
          <rect {...chip} />
          <rect {...chip} transform="rotate(28 17 47)" />
          <rect {...chip} transform="rotate(56 17 47)" />
          <circle cx="48" cy="48" r="10" />
        </>
      }
    >
      <rect {...chip} fill={ink.purple} />
      <rect {...chip} transform="rotate(28 17 47)" fill={ink.lilac} />
      <rect {...chip} transform="rotate(56 17 47)" fill="#2ec4b6" />
      <circle cx="17" cy="47" r="3" fill={ink.white} />
      {blocked}
    </Sticker>
  );
}

const claudeMark =
  "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z";

export function ClaudeSticker({ className }: StickerProps) {
  return (
    <svg viewBox="-2 -2 28 28" aria-hidden="true" className={cn("shrink-0", className)}>
      <g transform="rotate(-6 12 12)" strokeLinejoin="round" strokeLinecap="round">
        <path
          d={claudeMark}
          transform="translate(0 0.6)"
          fill="#000000"
          stroke="#000000"
          strokeWidth={3}
          opacity={0.1}
        />
        <path d={claudeMark} fill={ink.white} stroke={ink.white} strokeWidth={3} />
        <path d={claudeMark} fill="#d97757" />
      </g>
    </svg>
  );
}

export function CodexSticker({ className }: StickerProps) {
  return (
    <img
      src="/stickers/codex.png"
      alt=""
      width={144}
      height={144}
      className={cn("shrink-0", className)}
    />
  );
}
