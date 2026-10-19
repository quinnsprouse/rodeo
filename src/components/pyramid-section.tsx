import { useRef } from "react";

import { ArrowUpRight01Icon, Icon } from "@/components/icons";
import { PageSection } from "@/components/page-section";
import { PyramidDiagram } from "@/components/pyramid-diagram";
import { useEntrance } from "@/hooks/use-entrance";
import { usePlayOnView } from "@/hooks/use-play-on-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export const pyramidSectionId = "how-it-works";

export function PyramidSection() {
  const reducedMotion = usePrefersReducedMotion();
  const figure = useRef<HTMLDivElement>(null);
  const entrance = useEntrance(usePlayOnView(figure, !reducedMotion), 700);

  return (
    <PageSection id={pyramidSectionId}>
      <h2 className="font-brand text-l font-heavy text-foreground">
        Start with code you want the agent to copy.
      </h2>
      <p className="mt-s max-w-[520px] text-muted-foreground">
        Agents now write a lot of our code, and they learn by copying what's already there. Good
        patterns get repeated, and so do bad ones. The pyramid shows where a fix should live: the
        higher it sits, the less anyone has to repeat it. So Rodeo puts most of its work into the
        codebase and saves human review for what nothing else catches.
      </p>

      <PyramidDiagram ref={figure} size="section" entrance={entrance} className="mt-xl" />

      <p className="mt-xl text-s text-muted-foreground">
        Adapted from{" "}
        <a
          href="https://x.com/poteto/status/2111133080526495985"
          target="_blank"
          rel="noopener noreferrer"
          className="group/link inline-flex items-center gap-xxs text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground"
        >
          poteto's post on X
          <Icon
            icon={ArrowUpRight01Icon}
            className="size-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-safe:transition-transform motion-safe:duration-(--motion-duration) motion-safe:ease-(--motion-easing)"
            aria-hidden="true"
          />
        </a>
      </p>
    </PageSection>
  );
}
