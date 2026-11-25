import type { ReactNode, SVGAttributes } from "react";

import type { StickerProps } from "@/components/stickers/frame";
import { ink } from "@/demo/stickers/ink";
import { cn } from "@/lib/utils";

interface BrandStickerProps extends StickerProps {
  name: string;
  nameWidth: number;
  nameStart: number;
  baseline: number;
  tilt: number;
  drop?: number;
  outline: ReactNode;
  children: ReactNode;
}

const margin = { x: 2, y: 4 };

function BrandSticker({
  name,
  nameWidth,
  nameStart,
  baseline,
  tilt,
  drop = 0,
  outline,
  children,
  className,
}: BrandStickerProps) {
  const width = nameStart + nameWidth + 8;
  const lettering = (paint?: SVGAttributes<SVGTextElement>) => (
    <text
      x={nameStart}
      y={baseline}
      textLength={nameWidth}
      fontSize="21"
      className="font-brand font-heavy"
      {...paint}
    >
      {name}
    </text>
  );
  return (
    <svg
      viewBox={`${-margin.x} ${-margin.y} ${width + margin.x * 2} ${64 + margin.y * 2}`}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <g transform={`rotate(${tilt} ${width / 2} 32) translate(0 ${drop})`}>
        <g
          transform="translate(0 1.5)"
          fill={ink.shadow}
          stroke={ink.shadow}
          strokeWidth={8}
          strokeLinejoin="round"
          opacity={0.1}
        >
          {outline}
          {lettering()}
        </g>
        <g fill={ink.white} stroke={ink.white} strokeWidth={8} strokeLinejoin="round">
          {outline}
          {lettering()}
        </g>
        {children}
        {lettering({ fill: ink.charcoal })}
      </g>
    </svg>
  );
}

export function LighthouseSticker({ className }: StickerProps) {
  const tower = "M14.5 25.5 H25.5 L28.5 57 H11.5 Z";
  const roof = "M12.5 14 A7.5 6 0 0 1 27.5 14 Z";
  return (
    <BrandSticker
      name="Lighthouse"
      nameWidth={111.6}
      nameStart={35}
      baseline={43}
      tilt={-3}
      className={className}
      outline={
        <>
          <circle cx="20" cy="5.8" r="2.3" />
          <path d={roof} />
          <rect x="13.5" y="13.5" width="13" height="9" />
          <rect x="10.5" y="21.5" width="19" height="4.2" rx="2.1" />
          <path d={tower} />
        </>
      }
    >
      <circle cx="20" cy="5.8" r="2.3" fill={ink.charcoal} />
      <path d={roof} fill={ink.charcoal} />
      <rect x="13.5" y="13.5" width="13" height="9" fill={ink.charcoal} />
      <rect x="15.2" y="15.2" width="2.4" height="5.4" rx="0.8" fill={ink.lavender} />
      <rect x="18.6" y="15.2" width="2.8" height="5.4" rx="0.8" fill={ink.lavender} />
      <rect x="22.4" y="15.2" width="2.4" height="5.4" rx="0.8" fill={ink.lavender} />
      <path d={tower} fill={ink.paper} />
      <path d="M14.5 25.5 H25.5 L26.07 31.5 H13.93 Z" fill={ink.purple} />
      <path d="M13.36 37.5 H26.64 L27.21 43.5 H12.79 Z" fill={ink.purple} />
      <path d="M12.21 49.5 H27.79 L28.5 57 H11.5 Z" fill={ink.purple} />
      <rect x="10.5" y="21.5" width="19" height="4.2" rx="2.1" fill={ink.charcoal} />
    </BrandSticker>
  );
}

export function WebMcpSticker({ className }: StickerProps) {
  return (
    <BrandSticker
      name="WebMCP"
      nameWidth={92.5}
      nameStart={47}
      baseline={41.5}
      tilt={3}
      drop={5}
      className={className}
      outline={
        <>
          <rect x="6" y="30.5" width="6" height="10" rx="3" />
          <rect x="36" y="30.5" width="6" height="10" rx="3" />
          <circle cx="24" cy="11.5" r="3.6" />
          <rect x="9" y="21.5" width="30" height="25" rx="8.5" />
        </>
      }
    >
      <rect x="6" y="30.5" width="6" height="10" rx="3" fill={ink.lilac} />
      <rect x="36" y="30.5" width="6" height="10" rx="3" fill={ink.lilac} />
      <rect x="22.75" y="13.5" width="2.5" height="9" fill={ink.purple} />
      <circle cx="24" cy="11.5" r="3.6" fill={ink.lilac} />
      <rect x="9" y="21.5" width="30" height="25" rx="8.5" fill={ink.purple} />
      <circle cx="18" cy="33.5" r="4.8" fill={ink.white} />
      <circle cx="30" cy="33.5" r="4.8" fill={ink.white} />
      <circle cx="18" cy="33.5" r="2.4" fill={ink.charcoal} />
      <circle cx="30" cy="33.5" r="2.4" fill={ink.charcoal} />
    </BrandSticker>
  );
}
