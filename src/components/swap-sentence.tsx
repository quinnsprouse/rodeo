import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useId, useState } from "react";

import {
  ClaudeSticker,
  CodexSticker,
  CommentSticker,
  CommitSticker,
  DeadCodeSticker,
  EditSticker,
  OffBrandSticker,
  PushSticker,
} from "@/components/stickers/swap";
import { StaticChipFace, type SwapChoice } from "@/components/swap-chip-face";
import { usePageVisible } from "@/hooks/use-page-visible";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const AnimatedChipFace = lazy(() =>
  import("@/components/swap-chip-motion").then((mod) => ({ default: mod.AnimatedChipFace })),
);

type Choices = readonly [SwapChoice, ...SwapChoice[]];

const checkpoints: Choices = [
  { word: "edit", Sticker: EditSticker, swing: -1 },
  { word: "commit", Sticker: CommitSticker, swing: 1 },
  { word: "push", Sticker: PushSticker, swing: 1 },
];

const catches: Choices = [
  { word: "stray comments", Sticker: CommentSticker, swing: -1 },
  { word: "dead code", Sticker: DeadCodeSticker, swing: -1 },
  { word: "off-brand colors", Sticker: OffBrandSticker, swing: -1 },
];

const agents: Choices = [
  { word: "Claude Code", Sticker: ClaudeSticker, swing: -1 },
  { word: "Codex", Sticker: CodexSticker, swing: 1 },
];

const slots: readonly Choices[] = [checkpoints, catches, agents];

const firstSwapDelay = 600;
const swapInterval = 1800;

interface SwapState {
  picks: number[];
  next: number;
  moved: boolean;
}

function advance(state: SwapState, slot: number): SwapState {
  return {
    picks: state.picks.map((pick, index) =>
      index === slot ? (pick + 1) % (slots[index]?.length ?? 1) : pick,
    ),
    next: (slot + 1) % slots.length,
    moved: true,
  };
}

interface ChipProps {
  choices: Choices;
  pick: number;
  animate: boolean;
  hintId: string;
  onSwap: () => void;
  onHold: (held: boolean) => void;
}

function Chip({ choices, pick, animate, hintId, onSwap, onHold }: ChipProps) {
  const choice = choices[pick % choices.length] ?? choices[0];
  return (
    <button
      type="button"
      onClick={onSwap}
      onPointerEnter={() => onHold(true)}
      onPointerLeave={() => onHold(false)}
      onFocus={() => onHold(true)}
      onBlur={() => onHold(false)}
      aria-describedby={hintId}
      className="inline-flex h-[1.2em] items-center gap-xxs rounded-l bg-muted pr-xs pl-xxs align-middle transition duration-(--motion-duration) ease-(--motion-easing) select-none hover:bg-neutral-4 active:translate-y-(--motion-press-distance) md:h-[1.34em] md:gap-xs md:pr-m"
    >
      {animate ? (
        <ClientOnly fallback={<StaticChipFace choice={choice} />}>
          <Suspense fallback={<StaticChipFace choice={choice} />}>
            <AnimatedChipFace choice={choice} />
          </Suspense>
        </ClientOnly>
      ) : (
        <StaticChipFace choice={choice} />
      )}
    </button>
  );
}

export function SwapSentence() {
  const [state, setState] = useState<SwapState>({ picks: [0, 0, 0], next: 0, moved: false });
  const [held, setHeld] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const visible = usePageVisible();
  const hintId = useId();
  const autoplay = !reducedMotion && visible && !held;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(
      () => setState((current) => advance(current, current.next)),
      state.moved ? swapInterval : firstSwapDelay,
    );
    return () => window.clearTimeout(timer);
  }, [autoplay, state]);

  const chip = (slot: number, choices: Choices) => (
    <Chip
      choices={choices}
      pick={state.picks[slot] ?? 0}
      animate={!reducedMotion}
      hintId={hintId}
      onSwap={() => setState((current) => advance(current, slot))}
      onHold={setHeld}
    />
  );

  return (
    <>
      <p className="text-center text-display font-heavy tracking-xs text-foreground md:text-display-wide">
        <span className="block">
          Checks every <span className="whitespace-nowrap">{chip(0, checkpoints)},</span>
        </span>{" "}
        <span className="block">
          catches <span className="whitespace-nowrap">{chip(1, catches)},</span>
        </span>{" "}
        <span className="block">
          and keeps {chip(2, agents)}
          <br className="md:hidden" /> <span className="whitespace-nowrap">on track.</span>
        </span>
      </p>
      <span id={hintId} className="sr-only">
        Select a highlighted word to see another example.
      </span>
    </>
  );
}
