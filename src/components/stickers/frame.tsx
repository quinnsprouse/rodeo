import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const ink = {
  purple: "#863bff",
  purpleShade: "#7430e6",
  purpleDeepShade: "#6a1fe0",
  lilac: "#b794ff",
  lavender: "#e1ceff",
  charcoal: "#202020",
  paper: "#f0f0f0",
  silver: "#dedede",
  line: "#c5c5c5",
  slate: "#969696",
  orange: "#ffa344",
  red: "#ff5263",
  green: "#76ef6b",
  white: "#ffffff",
  shadow: "#000000",
};

export interface StickerProps {
  className?: string | undefined;
}

interface StickerFrameProps extends StickerProps {
  tilt: number;
  scale?: number;
  outline: ReactNode;
  children: ReactNode;
}

export function Sticker({ tilt, scale = 1, outline, children, className }: StickerFrameProps) {
  const inset = 32 * (1 - scale);
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("shrink-0", className)}>
      <g transform={`rotate(${tilt} 32 32) translate(${inset} ${inset}) scale(${scale})`}>
        <g
          transform="translate(0 1.5)"
          fill={ink.shadow}
          stroke={ink.shadow}
          strokeWidth={8}
          strokeLinejoin="round"
          opacity={0.1}
        >
          {outline}
        </g>
        <g fill={ink.white} stroke={ink.white} strokeWidth={8} strokeLinejoin="round">
          {outline}
        </g>
        {children}
      </g>
    </svg>
  );
}
