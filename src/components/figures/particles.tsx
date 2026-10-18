import type { ReactNode } from "react";

import { CoinGlint, CoinRim, CoinShade, CoinSide } from "@/components/stickers/coin";
import { useWebAnimation, type AnimationTiming } from "@/hooks/use-web-animation";

const samples = 20;
const times = Array.from({ length: samples }, (_, index) => index / (samples - 1));
const light = [-0.48, -0.36, 0.8] as const;
const faceDepth = 1.75;
const rimDepths = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];
const softRimDepths = [-1, 1];
const spillSizes = [4, 6, 4];

type Random = () => number;

function seeded(seed: number): Random {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const round = (value: number) => Math.round(value * 1000) / 1000;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function arc(rise: number, fall: number, start: number) {
  const pace = Math.sqrt(rise) + Math.sqrt(rise + fall);
  return times.map((t) => round(start + pace * pace * t * t - 2 * pace * Math.sqrt(rise) * t));
}

function facing(turn: number, tilt: number) {
  const yaw = (turn * Math.PI) / 180;
  const pitch = (tilt * Math.PI) / 180;
  return (
    Math.sin(yaw) * light[0] -
    Math.cos(yaw) * Math.sin(pitch) * light[1] +
    Math.cos(yaw) * Math.cos(pitch) * light[2]
  );
}

function placer(transform: string) {
  return (node: HTMLElement | null) => {
    node?.style.setProperty("transform", transform);
  };
}

const shadeFor = (lit: number) => round(0.3 * (1 - clamp(lit)));
const glintFor = (lit: number) => round(0.35 * clamp((lit - 0.86) / 0.14));

function makeToss(random: Random, spill: number, slot: number, launch: number) {
  const range = (min: number, max: number) => min + random() * (max - min);
  const lastSpill = spill === spillSizes.length - 1;
  const rise = range(6, 40);
  const fall = range(2, 58);
  const drift = lastSpill ? range(-28, 4) : range(-26, 26);
  const size = range(0.8, 1.12);
  const depth = range(1.15, 1.45);
  const haze = range(1.4, 3);
  const tilt = range(-40, 40);
  const phase = range(-70, 70);
  const spin = (random() < 0.5 ? -1 : 1) * range(1.3, 3.2) * 360;
  const roll = range(-50, 50);
  const turn = times.map((t) => round(phase + spin * t));
  const lit = turn.map((angle) => facing(angle, tilt));

  const duration = range(0.95, 1.4);
  const x = times.map((t) => round(drift * (1 - (1 - t) ** 1.25)));
  const y = arc(rise, fall, range(2, 12));
  const scale = times.map((t) =>
    round(size * (t < 0.1 ? 0.6 + 4 * t : 1 + (depth - 1) * ((t - 0.1) / 0.9) ** 1.6)),
  );

  const at = (lastSpill ? 78 : 88) * slot + 6;
  const timing = { duration: duration * 1000, delay: 450 * launch };
  const flight = {
    transform: times.map(
      (_, index) => `translate(${x[index]}px, ${y[index]}px) scale(${scale[index]})`,
    ),
    opacity: times.map((t) => round(t < 0.06 ? t / 0.06 : 1 - clamp((t - 0.78) / 0.22))),
  };

  return {
    key: `${spill}-${slot}`,
    timing,
    launch: { ...timing, start: { left: `${round(at)}%` } },
    flight,
    spin: {
      transform: times.map(
        (t, index) =>
          `rotateX(${round(tilt)}deg) rotateY(${turn[index]}deg) rotateZ(${round(roll * t)}deg)`,
      ),
    },
    sharp: { opacity: times.map((t) => round(1 - clamp((t - 0.6) / 0.26))) },
    soft: { opacity: times.map((t) => round(((haze + 0.6) / 3.6) * clamp((t - 0.4) / 0.22))) },
    front: { shade: { opacity: lit.map(shadeFor) }, glint: { opacity: lit.map(glintFor) } },
    back: {
      shade: { opacity: lit.map((value) => shadeFor(-value)) },
      glint: { opacity: lit.map((value) => glintFor(-value)) },
    },
  };
}

type Toss = ReturnType<typeof makeToss>;

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

const spills = spillSizes.map((count, spill) => {
  const launches = shuffled(spread(count));
  return spread(count).map((slot, index) => makeToss(random, spill, slot, launches[index] ?? 0));
});

const rims = rimDepths.map((z) => ({ z, place: placer(`translateZ(${z}px)`) }));
const softRims = softRimDepths.map((z) => ({ z, place: placer(`translateZ(${z}px)`) }));
const frontPlace = placer(`translateZ(${faceDepth}px)`);
const backPlace = placer(`translateZ(${-faceDepth}px) rotateY(180deg)`);
const layer = "absolute inset-0 block";
const bare = { duration: 0, delay: 0 };

type Lighting = Toss["front"];

function Glow({
  keyframes,
  timing,
  children,
}: {
  keyframes: PropertyIndexedKeyframes;
  timing: AnimationTiming;
  children: ReactNode;
}) {
  const animate = useWebAnimation(keyframes, timing);
  return (
    <span ref={animate} className={layer}>
      {children}
    </span>
  );
}

function Face({
  back = false,
  lighting,
  timing = bare,
}: {
  back?: boolean;
  lighting?: Lighting;
  timing?: AnimationTiming;
}) {
  return (
    <span ref={back ? backPlace : frontPlace} className={`${layer} backface-hidden`}>
      <CoinSide back={back} className="size-full" />
      {lighting && (
        <>
          <Glow keyframes={lighting.shade} timing={timing}>
            <CoinShade className="size-full" />
          </Glow>
          <Glow keyframes={lighting.glint} timing={timing}>
            <CoinGlint className="size-full" />
          </Glow>
        </>
      )}
    </span>
  );
}

function Spin({ toss, children }: { toss: Toss; children: ReactNode }) {
  const animate = useWebAnimation(toss.spin, toss.timing);
  return (
    <span ref={animate} className="relative block size-full transform-3d">
      {children}
    </span>
  );
}

function Coin({ toss }: { toss: Toss }) {
  const fly = useWebAnimation(toss.flight, toss.launch);
  const sharpen = useWebAnimation(toss.sharp, toss.timing);
  const soften = useWebAnimation(toss.soft, toss.timing);
  return (
    <span ref={fly} className="absolute top-0 -mt-2.75 -ml-2.75 block size-5.5">
      <span ref={sharpen} className={`${layer} perspective-dramatic`}>
        <Spin toss={toss}>
          {rims.map(({ z, place }) => (
            <span key={z} ref={place} className={layer}>
              <CoinRim className="size-full" />
            </span>
          ))}
          <Face lighting={toss.front} timing={toss.timing} />
          <Face back lighting={toss.back} timing={toss.timing} />
        </Spin>
      </span>
      <span ref={soften} className={`${layer} soft-focus perspective-dramatic`}>
        <Spin toss={toss}>
          {softRims.map(({ z, place }) => (
            <span key={z} ref={place} className={layer}>
              <CoinRim className="size-full" />
            </span>
          ))}
          <Face />
          <Face back />
        </Spin>
      </span>
    </span>
  );
}

export function CoinSpill({ spill, play }: { spill: number; play: boolean }) {
  if (!play) return null;
  return (spills[spill] ?? []).map((toss) => <Coin key={toss.key} toss={toss} />);
}
