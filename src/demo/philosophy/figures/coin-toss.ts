import { coinShape } from "@/demo/philosophy/figures/coin-shader";
import { overhead } from "@/demo/philosophy/figures/token-parts";

export type Vector = readonly [number, number, number];

export interface Spin {
  right: Vector;
  up: Vector;
  normal: Vector;
}

type Random = () => number;

function seeded(seed: number): Random {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const degrees = (value: number) => (value * Math.PI) / 180;

function eased(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

function makeToss(random: Random, spill: number, slot: number, launch: number) {
  const range = (min: number, max: number) => min + random() * (max - min);
  const lastSpill = spill === overhead.length - 1;
  const rise = range(8, 42);
  const fall = range(6, 60);
  return {
    spill,
    slot: 0.06 + (lastSpill ? 0.76 : 0.88) * slot,
    delay: 420 * launch,
    duration: range(1000, 1500),
    rise,
    pace: Math.sqrt(rise) + Math.sqrt(rise + fall),
    start: range(3, 11),
    drift: lastSpill ? range(-30, 6) : range(-28, 28),
    size: range(0.84, 1.14),
    depth: range(1.15, 1.45),
    haze: range(1.5, 3.4),
    phase: degrees(range(-70, 70)),
    spin: (random() < 0.5 ? -1 : 1) * degrees(range(1.2, 2.8) * 360),
  };
}

export type Toss = ReturnType<typeof makeToss>;

const random = seeded(20261018);

function spread(count: number) {
  return Array.from({ length: count }, (_, index) => (index + 0.2 + random() * 0.6) / count);
}

function shuffled<T>(items: T[]) {
  return items
    .map((item) => ({ item, order: random() }))
    .toSorted((first, second) => first.order - second.order)
    .map(({ item }) => item);
}

export const spills = overhead.map(({ coins }, spill) => {
  const launches = shuffled(spread(coins));
  return spread(coins).map((slot, index) => makeToss(random, spill, slot, launches[index] ?? 0));
});

const baseRadius = 11.5;
const popEnds = 0.12;
const spriteFrame = degrees(30);
const frameCatchingTheLight = degrees(-15);

function popAt(t: number) {
  if (t >= popEnds) return 1;
  const p = t / popEnds;
  return 0.55 + 0.45 * (1 - (1 - p) ** 3) + 0.08 * Math.sin(p * Math.PI);
}

export function landed(toss: Toss, elapsed: number) {
  return elapsed >= toss.delay + toss.duration;
}

export function flightAt(toss: Toss, elapsed: number) {
  const t = (elapsed - toss.delay) / toss.duration;
  if (t <= 0 || t >= 1) return undefined;
  const near = t < popEnds ? 0 : ((t - popEnds) / (1 - popEnds)) ** 1.5;
  return {
    x: toss.drift * (1 - (1 - t) ** 1.25),
    y: toss.start + toss.pace * toss.pace * t * t - 2 * toss.pace * Math.sqrt(toss.rise) * t,
    radius: baseRadius * toss.size * popAt(t) * (1 + (toss.depth - 1) * near),
    blur: toss.haze * eased(0.3, 1, t) ** 1.3,
    opacity: Math.min(clamp(t / 0.05), 1 - eased(0.74, 1, t)),
    spin: turnedBy(spriteFrameNear(toss.phase + toss.spin * t)),
    near,
  };
}

function spriteFrameNear(turn: number) {
  const steps = Math.round((turn - frameCatchingTheLight) / spriteFrame);
  return steps * spriteFrame + frameCatchingTheLight;
}

function turnedBy(turn: number): Spin {
  const [sine, cosine] = [Math.sin(turn), Math.cos(turn)];
  return { right: [cosine, 0, -sine], up: [0, 1, 0], normal: [sine, 0, cosine] };
}

const dot = (first: Vector, second: Vector) =>
  first[0] * second[0] + first[1] * second[1] + first[2] * second[2];

function normalized([x, y, z]: Vector): Vector {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

export const keyLight = normalized([-0.48, 0.36, 0.8]);
const halfway = normalized([keyLight[0], keyLight[1], keyLight[2] + 1]);
export const noGlint = { x: 0, y: 0, strength: 0 };

export type Glint = typeof noGlint;

export function glintOn({ right, up, normal }: Spin): Glint {
  const facing = normal[2] >= 0 ? 1 : -1;
  const toward = dot(normal, halfway) * facing;
  if (toward <= 0.2) return noGlint;
  const across = dot(right, halfway) / (toward * coinShape.dome);
  const along = dot(up, halfway) / (toward * coinShape.dome);
  const lift = facing * coinShape.halfThickness;
  return {
    x: right[0] * across + up[0] * along + normal[0] * lift,
    y: right[1] * across + up[1] * along + normal[1] * lift,
    strength: clamp((1.05 - Math.hypot(across, along)) / 0.5),
  };
}

export function lingering(previous: Glint, next: Glint, elapsed: number): Glint {
  const faded = previous.strength * Math.exp(-elapsed / 85);
  return next.strength >= faded ? next : { ...previous, strength: faded };
}
