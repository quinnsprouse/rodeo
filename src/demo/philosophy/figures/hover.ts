import type { PointerEvent } from "react";

export function hoveredData(event: PointerEvent, key: string) {
  if (event.pointerType === "touch" || !(event.target instanceof Element)) return null;
  return event.target.closest(`[data-${key}]`)?.getAttribute(`data-${key}`) ?? null;
}
