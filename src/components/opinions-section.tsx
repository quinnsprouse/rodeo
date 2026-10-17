import type { ComponentType } from "react";

import { PageSection } from "@/components/page-section";
import type { StickerProps } from "@/components/stickers/frame";
import { CommentSticker } from "@/components/stickers/swap";
import {
  BrowserTestsSticker,
  DesignSystemSticker,
  LintRulesSticker,
  OneWaySticker,
  ShortDocsSticker,
} from "@/components/stickers/topics";

const opinions: { title: string; reason: string; Sticker: ComponentType<StickerProps> }[] = [
  {
    title: "No code comments",
    reason:
      "Most comments restate in English what the code already says, and an agent can read the code. So each one costs tokens and adds nothing. Agents also copy what they see, so one comment leads to more.",
    Sticker: CommentSticker,
  },
  {
    title: "Browser tests, not unit tests",
    reason:
      'Agents often write unit tests like "the header says Welcome." Change the copy and the test fails though nothing broke, so the agent spends tokens rewriting it. A browser test clicks through a real flow. When it fails, a person would have hit the same bug.',
    Sticker: BrowserTestsSticker,
  },
  {
    title: "Lint rules stay on",
    reason:
      "When a lint rule gets in the way, the easy fix for an agent is a disable comment, and the problem hides. Rodeo rejects those comments. Exceptions go in vite.config.ts with a reason, so you can see them all in one file.",
    Sticker: LintRulesSticker,
  },
  {
    title: "Docs stay short",
    reason:
      "An agent loads docs into the same context window it needs for the task, so every extra paragraph crowds out the work. Docs also go stale, and an agent believes them anyway. Rodeo ships seven short guides, and an agent opens one only when the task needs it.",
    Sticker: ShortDocsSticker,
  },
  {
    title: "One design system",
    reason:
      "Left alone, an agent reaches for a new gray or a 13px font whenever it needs one, and each screen drifts a little further. Lint knows the theme's sizes and colors and rejects anything else, so new screens match the old ones without you checking.",
    Sticker: DesignSystemSticker,
  },
  {
    title: "Code flows one way",
    reason:
      "Routes import components, components import hooks, and hooks import src/lib. Lint blocks any import that points back up. So when an agent edits a component, it knows nothing below can break.",
    Sticker: OneWaySticker,
  },
];

export function OpinionsSection() {
  return (
    <PageSection>
      <h2 className="font-brand text-l font-heavy text-foreground">Rodeo has opinions.</h2>
      <p className="mt-s max-w-[520px] text-muted-foreground">
        In a Rodeo app, agents read the code far more often than people do, and every line they read
        costs tokens. So Rodeo drops a few habits that suit people but waste an agent's time.
      </p>

      <ul className="mt-xxl grid gap-x-xxl gap-y-xl sm:grid-cols-2">
        {opinions.map(({ title, reason, Sticker }) => (
          <li key={title}>
            <Sticker className="size-11" />
            <h3 className="mt-s font-medium text-foreground">{title}</h3>
            <p className="mt-xs text-s text-muted-foreground">{reason}</p>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
