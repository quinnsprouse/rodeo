import { createCoinPainter, type CoinSprite } from "@/demo/philosophy/figures/coin-painter";
import {
  flightAt,
  glintOn,
  landed,
  lingering,
  noGlint,
  spills,
  type Glint,
  type Toss,
} from "@/demo/philosophy/figures/coin-toss";

const sharpestScreen = 3;

interface Segment {
  left: number;
  top: number;
  width: number;
}

function segmentsBehind(canvas: HTMLCanvasElement): Segment[] {
  const frame = canvas.getBoundingClientRect();
  const anchors = canvas.parentElement?.parentElement?.querySelectorAll("[data-spill]") ?? [];
  return Array.from(anchors, (anchor) => {
    const box = anchor.getBoundingClientRect();
    return { left: box.left - frame.left, top: box.top - frame.top, width: box.width };
  });
}

export function createCoinShow(canvas: HTMLCanvasElement) {
  const painter = createCoinPainter(canvas);
  const began: number[] = [];
  const glints = new Map<Toss, Glint>();
  let segments: Segment[] = [];
  let ratio = 1;
  let frame = 0;
  let previous = 0;

  function measure() {
    ratio = Math.min(window.devicePixelRatio, sharpestScreen);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    segments = segmentsBehind(canvas);
  }

  function sprite(toss: Toss, elapsed: number, sinceLastFrame: number) {
    const flight = flightAt(toss, elapsed);
    const segment = segments[toss.spill];
    if (!flight || !segment) return undefined;
    const glint = lingering(glints.get(toss) ?? noGlint, glintOn(flight.spin), sinceLastFrame);
    glints.set(toss, glint);
    const coin: CoinSprite = {
      x: (segment.left + segment.width * toss.slot + flight.x) * ratio,
      y: (segment.top + flight.y) * ratio,
      radius: flight.radius * ratio,
      spin: flight.spin,
      blur: flight.blur * ratio,
      opacity: flight.opacity,
      glint: { ...glint, strength: glint.strength * (1 - flight.near * 0.5) },
    };
    return { coin, near: flight.near };
  }

  function draw(now: number) {
    const sinceLastFrame = now - previous;
    previous = now;
    const tossed = began.flatMap((start, spill) =>
      (spills[spill] ?? []).map((toss) => ({ toss, elapsed: now - start })),
    );
    const flying = tossed
      .map(({ toss, elapsed }) => sprite(toss, elapsed, sinceLastFrame))
      .filter((flight) => flight !== undefined)
      .toSorted((first, second) => first.near - second.near);
    painter?.clear();
    for (const { coin } of flying) painter?.paint(coin);
    const more = tossed.some(({ toss, elapsed }) => !landed(toss, elapsed));
    frame = more ? window.requestAnimationFrame(draw) : 0;
  }

  return {
    spill(count: number) {
      if (!painter || count <= began.length) return;
      measure();
      const now = performance.now();
      while (began.length < count) began.push(now);
      if (frame !== 0) return;
      previous = now;
      frame = window.requestAnimationFrame(draw);
    },
    stop() {
      window.cancelAnimationFrame(frame);
      painter?.clear();
    },
  };
}
