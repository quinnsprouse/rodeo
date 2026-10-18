import type { ComponentType } from "react";

import { ArrowUpRight01Icon, Icon } from "@/components/icons";
import { PageSection } from "@/components/page-section";
import { PyramidSlices } from "@/components/pyramid-slices";
import type { StickerProps } from "@/components/stickers/frame";
import {
  CodebaseSticker,
  HumanReviewSticker,
  ProseSticker,
  StaticAnalysisSticker,
} from "@/components/stickers/topics";

const layers: { name: string; detail: string; Sticker: ComponentType<StickerProps> }[] = [
  { name: "Codebase", detail: "Layers, tokens, server-only files.", Sticker: CodebaseSticker },
  { name: "Static analysis", detail: "Every error names its fix.", Sticker: StaticAnalysisSticker },
  { name: "Prose", detail: "Short guides, read when needed.", Sticker: ProseSticker },
  {
    name: "Human review",
    detail: "Only the exceptions, each marked.",
    Sticker: HumanReviewSticker,
  },
];

export const pyramidSectionId = "how-it-works";

export function PyramidSection() {
  return (
    <PageSection id={pyramidSectionId}>
      <h2 className="font-brand text-l font-heavy text-foreground">
        A better foundation to build on.
      </h2>
      <p className="mt-s max-w-[520px] text-muted-foreground">
        Agents copy whatever's already in a codebase. Give them a messy one and you get more mess,
        just faster. So Rodeo starts with the foundation. The pyramid shows where its effort goes:
        most into the codebase, less into static analysis and prose, and the least into human
        review, which scales the worst.
      </p>

      <div className="mt-xl flex flex-col gap-xl sm:flex-row sm:items-start sm:gap-xl">
        <PyramidSlices className="w-full max-w-[320px]" />

        <ol className="flex flex-col gap-m sm:gap-m">
          {layers.map(({ name, detail, Sticker }) => (
            <li key={name} className="flex items-center gap-s sm:h-[51px]">
              <Sticker className="size-9" />
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-s text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-xl text-s text-muted-foreground">
        Adapted from{" "}
        <a
          href="https://x.com/poteto/status/2111133080526495985"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-xxs text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground"
        >
          poteto's post on X
          <Icon icon={ArrowUpRight01Icon} className="size-3" aria-hidden="true" />
        </a>
      </p>
    </PageSection>
  );
}
