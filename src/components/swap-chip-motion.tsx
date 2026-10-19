import { spring } from "motion";
import { useLayoutEffect, useRef } from "react";

import { stickerWindow, type SwapChoice } from "@/components/swap-chip-face";
import { cn } from "@/lib/utils";

const settle = 350;
const drift = 15;
const letterClass = "inline-block whitespace-pre";

function springEasing(duration: number, bounce: number) {
  const { ease } = spring.applyToOptions({ duration, bounce });
  if (typeof ease !== "function") return "ease-out";
  const points = Array.from(
    { length: 48 },
    (_, index) => Math.round(ease(index / 47) * 1000) / 1000,
  );
  return `linear(${points.join(", ")})`;
}

const snappy = { duration: settle, easing: springEasing(settle, 0.15) };
const popIn = "cubic-bezier(0.16, 0.55, 0.3, 1)";
const backOut = "cubic-bezier(0.33, 1.53, 0.69, 0.99)";

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const graphemes = (text: string) => Array.from(segmenter.segment(text), ({ segment }) => segment);

function commonLetters(before: string[], after: string[]) {
  const lengths = before.map(() => after.map(() => 0));
  const at = (row: number, column: number) => lengths[row]?.[column] ?? 0;
  for (let row = before.length - 1; row >= 0; row -= 1) {
    const cells = lengths[row] ?? [];
    for (let column = after.length - 1; column >= 0; column -= 1) {
      cells[column] =
        before[row] === after[column]
          ? at(row + 1, column + 1) + 1
          : Math.max(at(row + 1, column), at(row, column + 1));
    }
  }
  const pairs = new Map<number, number>();
  let row = 0;
  let column = 0;
  while (row < before.length && column < after.length) {
    if (before[row] === after[column]) {
      pairs.set(column, row);
      row += 1;
      column += 1;
    } else if (at(row + 1, column) >= at(row, column + 1)) {
      row += 1;
    } else {
      column += 1;
    }
  }
  return pairs;
}

interface Letter {
  char: string;
  node: HTMLSpanElement;
}

function letterNode(char: string) {
  const node = document.createElement("span");
  node.className = letterClass;
  node.textContent = char;
  return node;
}

function scattered(index: number, count: number, change: number) {
  const progress = count <= 1 ? 0 : index / (count - 1);
  return `translateX(${(progress - 0.5) * drift * change}px) scale(0.85)`;
}

function morph(root: HTMLElement, previous: Letter[], word: string) {
  const chars = graphemes(word);
  const box = root.getBoundingClientRect();
  const zoom = box.width / (root.offsetWidth || box.width || 1);
  const leftOf = (node: HTMLElement) => (node.getBoundingClientRect().left - box.left) / zoom;
  const from = new Map(previous.map((letter) => [letter, leftOf(letter.node)]));
  const pairs = commonLetters(
    previous.map((letter) => letter.char),
    chars,
  );
  const change =
    (chars.length - pairs.size + previous.length - pairs.size) /
    Math.max(chars.length, previous.length, 1);
  const next = chars.map((char, index) => {
    const kept = previous[pairs.get(index) ?? -1];
    return kept ?? { char, node: letterNode(char) };
  });
  const staying = new Set(next);

  for (const [index, letter] of previous.entries()) {
    if (staying.has(letter)) continue;
    const { node } = letter;
    node.style.setProperty("position", "absolute");
    node.style.setProperty("left", `${from.get(letter) ?? 0}px`);
    const leaving = node.animate(
      {
        opacity: [1, 0],
        transform: ["none", scattered(index, previous.length, change)],
        filter: ["blur(0px)", "blur(4px)"],
      },
      { ...snappy, fill: "forwards" },
    );
    leaving.addEventListener("finish", () => node.remove());
  }

  for (const animation of root.getAnimations({ subtree: true })) {
    if (!(animation.effect instanceof KeyframeEffect)) continue;
    const target = animation.effect.target;
    if (target === root || next.some((letter) => letter.node === target)) animation.cancel();
  }
  for (const letter of next) root.append(letter.node);
  root.animate({ width: [`${box.width / zoom}px`, `${root.offsetWidth}px`] }, snappy);

  for (const [index, letter] of next.entries()) {
    const start = from.get(letter);
    if (start === undefined) {
      letter.node.animate(
        {
          opacity: [0, 1],
          transform: [scattered(index, chars.length, change), "none"],
          filter: ["blur(4px)", "blur(0px)"],
        },
        snappy,
      );
      continue;
    }
    const shift = start - leftOf(letter.node);
    if (shift !== 0) letter.node.animate({ transform: [`translateX(${shift}px)`, "none"] }, snappy);
  }
  return next;
}

function Word({ word }: { word: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const letters = useRef<Letter[]>([]);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    if (letters.current.length === 0) {
      letters.current = graphemes(word).map((char) => ({ char, node: letterNode(char) }));
      node.replaceChildren(...letters.current.map((letter) => letter.node));
      return;
    }
    letters.current = morph(node, letters.current, word);
  }, [word]);

  return (
    <>
      <span className="sr-only">{word}</span>
      <span ref={root} aria-hidden="true" className="relative inline-flex" />
    </>
  );
}

function Stickers({ choices, pick }: { choices: readonly SwapChoice[]; pick: number }) {
  const frame = useRef<HTMLSpanElement>(null);
  const shown = useRef(pick);

  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = pick;
    const stickers = frame.current?.children;
    if (previous === pick || !stickers) return;
    const swing = choices[pick]?.swing ?? 1;
    const outSwing = choices[previous]?.swing ?? 1;
    stickers[pick]?.animate(
      [
        { transform: `scale(0.4) rotate(${-16 * swing}deg)`, easing: popIn },
        { transform: `scale(1.2) rotate(${5 * swing}deg)`, offset: 2 / 3, easing: backOut },
        { transform: "none" },
      ],
      600,
    );
    stickers[pick]?.animate({ opacity: [0, 1] }, { duration: 180, easing: "ease-out" });
    stickers[previous]?.animate(
      { opacity: [1, 0], transform: ["none", `scale(0.5) rotate(${5 * outSwing}deg)`] },
      { duration: 200, easing: "ease-out" },
    );
  }, [pick, choices]);

  return (
    <span ref={frame} className={stickerWindow} aria-hidden="true">
      {choices.map(({ word, Sticker }, index) => (
        <Sticker
          key={word}
          className={cn("absolute inset-0 size-full", index !== pick && "opacity-0")}
        />
      ))}
    </span>
  );
}

export function AnimatedChipFace({
  choices,
  pick,
}: {
  choices: readonly SwapChoice[];
  pick: number;
}) {
  const word = choices[pick]?.word ?? "";
  return (
    <>
      <Stickers choices={choices} pick={pick} />
      <Word word={word} />
    </>
  );
}
