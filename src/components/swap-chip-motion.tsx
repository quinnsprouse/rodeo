import { Calligraph } from "calligraph";
import { AnimatePresence, LazyMotion, m, type Transition } from "motion/react";

import { stickerWindow, type SwapChoice } from "@/components/swap-chip-face";

const pop: Transition = {
  duration: 0.6,
  times: [0, 2 / 3, 1],
  ease: [[0.16, 0.55, 0.3, 1], "backOut"],
};

const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.domAnimation);

export function AnimatedChipFace({ choice }: { choice: SwapChoice }) {
  const { Sticker, swing } = choice;
  return (
    <>
      <span className={stickerWindow} aria-hidden="true">
        <LazyMotion features={loadMotionFeatures} strict>
          <AnimatePresence initial={false}>
            <m.span
              key={choice.word}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.4, rotate: -16 * swing }}
              animate={{ opacity: 1, scale: [0.4, 1.2, 1], rotate: [-16 * swing, 5 * swing, 0] }}
              exit={{
                opacity: 0,
                scale: 0.5,
                rotate: 5 * swing,
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              transition={{
                opacity: { duration: 0.18, ease: "easeOut" },
                scale: pop,
                rotate: pop,
              }}
            >
              <Sticker className="size-full" />
            </m.span>
          </AnimatePresence>
        </LazyMotion>
      </span>
      <Calligraph animation="snappy" className="relative">
        {choice.word}
      </Calligraph>
    </>
  );
}
