import { useState, type PointerEvent } from "react";

function hoveredData(event: PointerEvent, key: string) {
  if (event.pointerType === "touch" || !(event.target instanceof Element)) return null;
  return event.target.closest(`[data-${key}]`)?.getAttribute(`data-${key}`) ?? null;
}

export function useHoveredData(key: string, { keepOnGap = false } = {}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return {
    hovered,
    handlers: {
      onPointerOver: (event: PointerEvent) => {
        const value = hoveredData(event, key);
        if (value || !keepOnGap) setHovered(value);
      },
      onPointerLeave: () => setHovered(null),
    },
  };
}
