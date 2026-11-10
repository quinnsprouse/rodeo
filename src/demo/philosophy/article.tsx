import type { ComponentType, ReactNode } from "react";

import type { StickerProps } from "@/components/stickers/frame";
import { formatPublished } from "@/demo/philosophy/format-date";
import { published } from "@/demo/philosophy/page";
import { sections } from "@/demo/philosophy/sections";

function Section({
  id,
  title,
  Sticker,
  children,
}: {
  id: string;
  title: string;
  Sticker: ComponentType<StickerProps>;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-xl pt-xxl">
      <div className="flex items-center gap-s pb-s">
        <Sticker className="size-[30px]" />
        <h2 id={`${id}-title`} className="font-medium text-foreground">
          {title}
        </h2>
        <span className="h-px min-w-m grow bg-border" aria-hidden="true" />
      </div>
      <div className="space-y-m">{children}</div>
    </section>
  );
}

export function PhilosophyArticle() {
  return (
    <article className="text-foreground">
      <header className="pb-xl">
        <h1 className="font-medium">Rodeo Philosophy</h1>
        <p className="text-muted-foreground">
          <time dateTime={published}>{formatPublished(published)}</time>
        </p>
      </header>

      <div className="space-y-m">
        <p>
          rodeo is the react starter i built for myself to work with agents. as agents got better, i
          started building more and more web apps with them, and i needed a solid foundation to
          build all of them off of.
        </p>
        <p>
          and the better agents got, the more i had to change how i worked, mostly because i was
          tired of waiting forever on an agent and then not trusting what it wrote.
        </p>
        <p>
          the thing i kept running into is that agents are really good at copying whatever's already
          in your codebase.
        </p>
        <p>
          rodeo is where all of that ended up. it's the starting place i wanted for any web app.
        </p>
        <p>
          this isn't a setup guide. it's more about how i think about building with agents, and it's
          opinionated.
        </p>
        <p>
          everything in rodeo comes back to three ideas: teach with the codebase, catch mistakes
          where they happen, and spend tokens on signal.
        </p>
        <p>none of them are new honestly. agents just made them matter a lot more.</p>
        <p>
          you'll probably disagree with some of it, and that's fine. it's a starter. rip out
          whatever doesn't work for you.
        </p>
      </div>

      {sections.map(({ id, title, Sticker, body }) => (
        <Section key={id} id={id} title={title} Sticker={Sticker}>
          {body}
        </Section>
      ))}
    </article>
  );
}
