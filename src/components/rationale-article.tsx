import type { ComponentType, ReactNode } from "react";

import { CatchFigure } from "@/components/figures/catch-figure";
import { PyramidFigure } from "@/components/figures/pyramid-figure";
import { RenameFigure } from "@/components/figures/rename-figure";
import { TokenBarsFigure } from "@/components/figures/token-figure";
import { UpkeepFigure } from "@/components/figures/upkeep-figure";
import type { StickerProps } from "@/components/stickers/frame";
import { HeartSticker, ScissorsSticker, TokenSticker } from "@/components/stickers/rationale";
import {
  CodebaseSticker,
  HumanReviewSticker,
  StaticAnalysisSticker,
} from "@/components/stickers/topics";
import { philosophyMeta } from "@/config/site";
import { formatPublished } from "@/lib/format-date";

export const rationaleSections = [
  { id: "teaching", title: "Teaching through the codebase" },
  { id: "catching", title: "Catching mistakes where they happen" },
  { id: "tokens", title: "Spending tokens on signal" },
  { id: "review", title: "You review what matters" },
  { id: "change", title: "This will change" },
  { id: "thanks", title: "Acknowledgements" },
] as const;

type SectionId = (typeof rationaleSections)[number]["id"];

const potetoPost = "https://x.com/poteto/status/2111133080526495985";
const pocockSkills = "https://github.com/mattpocock/skills";
const stack = [
  { name: "vite+", href: "https://viteplus.dev" },
  { name: "tanstack start", href: "https://tanstack.com/start" },
  { name: "react", href: "https://react.dev" },
  { name: "tailwind", href: "https://tailwindcss.com" },
  { name: "shadcn/ui", href: "https://ui.shadcn.com" },
  { name: "base ui", href: "https://base-ui.com" },
  { name: "nitro", href: "https://nitro.build" },
];

function stackSeparator(index: number) {
  if (index === stack.length - 1) return ".";
  return index === stack.length - 2 ? " and " : ", ";
}
const link =
  "text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground";

interface SectionProps {
  id: SectionId;
  Sticker: ComponentType<StickerProps>;
  children: ReactNode;
}

function Section({ id, Sticker, children }: SectionProps) {
  const title = rationaleSections.find((section) => section.id === id)?.title;
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

function Subheading({ children }: { children: ReactNode }) {
  return <h3 className="pt-m font-medium text-foreground">{children}</h3>;
}

export function RationaleArticle() {
  return (
    <article className="text-foreground">
      <header className="pb-xl">
        <h1 className="font-medium">Rodeo Philosophy</h1>
        <p className="text-muted-foreground">
          <time dateTime={philosophyMeta.published}>
            {formatPublished(philosophyMeta.published)}
          </time>
        </p>
      </header>

      <div className="space-y-m">
        <p>
          rodeo is the react starter i built for myself to work with agents. as agents got better, i
          started building more and more web apps with them, and i needed a solid foundation to
          build all of them off of.
        </p>
        <p>
          and the better agents got, the more the way i worked had to change. i kept changing how i
          worked, mostly because i was tired of waiting forever on an agent and then not trusting
          what it wrote.
        </p>
        <p>
          the thing i kept running into is that agents are really good at copying whatever's already
          in your codebase.
        </p>
        <p>
          rodeo is where all of that ended up. it's the starting place i wanted for any web app,
          something durable and reliable from day one.
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

      <Section id="teaching" Sticker={CodebaseSticker}>
        <p>
          this part comes straight from{" "}
          <a href={potetoPost} target="_blank" rel="noopener noreferrer" className={link}>
            a post by poteto
          </a>{" "}
          on x. the idea is you want most of your effort at the top, on the codebase itself. then
          static analysis. then prose. human review goes last because it's the thing that scales the
          worst.
        </p>
        <p>
          so in rodeo, the codebase does most of the work. on top of that, lint checks everything,
          even the design. if an agent reaches for a color or a size that isn't in the theme, lint
          fails it, so you don't end up with little design papercuts everywhere. and most lint
          errors tell the agent how to fix it.
        </p>
        <p>
          agents take the shortest path, every time. left alone, an agent will write a server
          function that trusts whatever the browser sends. in rodeo that fails lint until the
          function checks its input with a schema.
        </p>
        <PyramidFigure />
      </Section>

      <Section id="catching" Sticker={StaticAnalysisSticker}>
        <p>
          an agent is at its best right after it writes something. the file's open, the context is
          fresh, and fixing it costs one more edit. the same mistake caught in a pull request costs
          a review comment, another commit, and another CI run.
        </p>
        <p>
          so rodeo checks all the time. every edit gets formatted, linted and typechecked. the end
          of a turn checks everything that changed. commits check the staged files, pushes build the
          app and run every browser test, and CI starts from a clean install and does it all again.
        </p>
        <p>
          the fast checks mostly look at the file the agent just touched, so they come back quick.
          the slow stuff, building the whole app and running browser tests, waits until you push,
          when you're done anyway.
        </p>
        <CatchFigure />
        <p>
          rodeo's errors name their fix, most of them anyway. an error that just says no teaches the
          agent to sneak around it. write bg-gray-100 and the error lists the theme colors to use
          instead.
        </p>
        <p>
          it sounds small, but you stop finding the same mistake in every review, because the agent
          already heard about it the second it wrote it.
        </p>
      </Section>

      <Section id="tokens" Sticker={TokenSticker}>
        <p>
          agents read everything you give them: comments, tests, docs. all of it costs context they
          could be spending on the actual task.
        </p>
        <TokenBarsFigure />
        <p>
          and it compounds. every comment is something the next agent reads, and probably copies.
          every unit test is something the next change has to go fix. so the overhead isn't a one
          time cost, it grows with the codebase. give it a year and a big chunk of every task is
          upkeep on stuff that never caught a single bug.
        </p>
        <UpkeepFigure />
        <p>so rodeo drops a few habits that are fine for people and kinda terrible for agents.</p>
        <Subheading>Comments</Subheading>
        <p>
          most comments just say the code again in english. the agent can already read the code, so
          that's tokens for nothing. and agents copy what they see. one comment explaining a
          workaround and suddenly every other file has one. it spreads like a weed.
        </p>
        <p>
          if the code needs explaining, explain it in code. a better name, a smaller function, a
          type. and if none of that works, it's usually a workaround, and the fix is fixing it, not
          writing about it.
        </p>
        <RenameFigure />
        <Subheading>Unit tests</Subheading>
        <p>
          agents love writing tests like "the header says welcome". then you change the header, the
          test fails even though nothing broke, and the agent burns tokens rewriting a test that
          never caught anything. a browser test clicks through the app like a person would, so when
          it fails, something's broken.
        </p>
        <p>
          browser tests are slower, sure. but you need way fewer of them, and they test what people
          do.
        </p>
        <Subheading>Docs</Subheading>
        <p>
          rodeo has seven short guides. an agent opens one when the task needs it. a hook blocks new
          docs in most of the repo, because docs go stale and agents trust them anyway.
        </p>
        <p>if something can be a lint rule, it's a lint rule.</p>
      </Section>

      <Section id="review" Sticker={HumanReviewSticker}>
        <p>
          i still want to read what the agent wrote and decide whether the feature makes sense. i
          just don't want to spend that time pointing out the same random colors or missing input
          checks.
        </p>
        <p>after a week in a rodeo app i hope you trust your agents a little more.</p>
      </Section>

      <Section id="change" Sticker={ScissorsSticker}>
        <p>
          none of this is set in stone. models keep getting smarter, and some of these guardrails
          are going to stop pulling their weight. a rule that saves an agent today might just be
          noise for the next model.
        </p>
        <p>
          when a guardrail stops catching real mistakes, i'll take it out. rodeo should fit what the
          current frontier models need, not what they needed a year ago.
        </p>
        <p>
          the goal is to keep rodeo as small as it can be. it's free, and ideally it saves you some
          tokens and some review time.
        </p>
      </Section>

      <Section id="thanks" Sticker={HeartSticker}>
        <p>
          huge thanks to poteto. the pyramid comes from{" "}
          <a href={potetoPost} target="_blank" rel="noopener noreferrer" className={link}>
            their post on x
          </a>
          , and so does the idea of killing comments.
        </p>
        <p>
          thanks to matt pocock too.{" "}
          <a href={pocockSkills} target="_blank" rel="noopener noreferrer" className={link}>
            his skills
          </a>{" "}
          and his focus on what matters now that agents write the code helped me narrow rodeo down a
          lot.
        </p>
        <p>
          rodeo is built on{" "}
          {stack.map((tool, index) => (
            <span key={tool.name}>
              <a href={tool.href} target="_blank" rel="noopener noreferrer" className={link}>
                {tool.name}
              </a>
              {stackSeparator(index)}
            </span>
          ))}{" "}
          thank you all.
        </p>
      </Section>
    </article>
  );
}
