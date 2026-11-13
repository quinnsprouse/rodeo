import { useEffect, useRef } from "react";

import { createCoinShow } from "@/demo/philosophy/figures/coin-show";

type CoinShow = ReturnType<typeof createCoinShow>;

export function CoinSpills({ spilled }: { spilled: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const show = useRef<CoinShow | null>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const started = createCoinShow(canvas.current);
    show.current = started;
    return () => {
      started.stop();
      show.current = null;
    };
  }, []);

  useEffect(() => {
    show.current?.spill(spilled);
  }, [spilled]);

  return (
    <div className="pointer-events-none absolute -inset-x-10 -top-24 -bottom-28">
      <canvas ref={canvas} aria-hidden="true" className="size-full" />
    </div>
  );
}
