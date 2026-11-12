import { useEffect, useRef, type RefObject } from "react";

export function useFollowActiveRow(
  list: RefObject<HTMLElement | null>,
  active: string | number | undefined,
  attribute: `data-${string}`,
) {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const rows = list.current;
    const line = marker.current;
    const row =
      active === undefined ? null : rows?.querySelector<HTMLElement>(`[${attribute}="${active}"]`);
    if (!rows || !row || !line) return;
    const inset = (Number.parseFloat(getComputedStyle(rows).rowGap) || 0) / 2;
    line.style.setProperty("--row-top", `${row.offsetTop - inset}px`);
    line.style.setProperty("--row-height", `${row.offsetHeight + inset * 2}px`);
  }, [list, active, attribute]);

  return marker;
}
