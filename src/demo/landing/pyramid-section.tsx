import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { useRef } from "react";

import { Icon } from "@/components/icon";
import { ExternalLink } from "@/demo/external-link";
import { PageSection } from "@/demo/landing/page-section";
import { PyramidDiagram } from "@/demo/landing/pyramid-diagram";
import { links } from "@/demo/links";
import { usePlayOnView } from "@/hooks/use-play-on-view";

export const pyramidSectionId = "how-it-works";

export function PyramidSection() {
  const figure = useRef<HTMLDivElement>(null);
  const playback = usePlayOnView(figure);

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

      <PyramidDiagram ref={figure} size="full" playback={playback} className="mt-xl" />

      <p className="mt-xl text-s text-muted-foreground">
        Adapted from{" "}
        <ExternalLink
          href={links.potetoPost}
          className="group/link inline-flex items-center gap-xxs text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground"
        >
          poteto's post on X
          <Icon
            icon={ArrowUpRight01Icon}
            className="size-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-safe:transition-transform motion-safe:duration-(--motion-duration) motion-safe:ease-(--motion-easing)"
            aria-hidden="true"
          />
        </ExternalLink>
      </p>
    </PageSection>
  );
}
