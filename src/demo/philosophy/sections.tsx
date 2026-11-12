import type { ComponentType, ReactNode } from "react";

import type { StickerProps } from "@/components/stickers/frame";
import { ExternalLink } from "@/demo/external-link";
import { links } from "@/demo/links";
import { CatchFigure } from "@/demo/philosophy/figures/catch-figure";
import { PyramidFigure } from "@/demo/philosophy/figures/pyramid-figure";
import { RenameFigure } from "@/demo/philosophy/figures/rename-figure";
import { TokenBarsFigure } from "@/demo/philosophy/figures/token-figure";
import { UpkeepFigure } from "@/demo/philosophy/figures/upkeep-figure";
import { HeartSticker, ScissorsSticker, TokenSticker } from "@/demo/stickers/philosophy";
import { CodebaseSticker, HumanReviewSticker, StaticAnalysisSticker } from "@/demo/stickers/topics";

const pocockSkills = "https://github.com/mattpocock/skills";
const stack = [
  { name: "vite+", href: links.vitePlus },
  { name: "tanstack start", href: links.tanstackStart },
  { name: "react", href: links.react },
  { name: "tailwind", href: links.tailwind },
  { name: "shadcn/ui", href: links.shadcn },
  { name: "base ui", href: links.baseUi },
  { name: "nitro", href: links.nitro },
];

function stackSeparator(index: number) {
  if (index === stack.length - 1) return ".";
  return index === stack.length - 2 ? " and " : ", ";
}
const link =
  "text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground";

function Subheading({ children }: { children: ReactNode }) {
  return <h3 className="pt-m font-medium text-foreground">{children}</h3>;
}

export const sections: {
  id: string;
  title: string;
  Sticker: ComponentType<StickerProps>;
  body: ReactNode;
}[] = [
  {
    id: "teaching",
    title: "Teaching through the codebase",
    Sticker: CodebaseSticker,
    body: (
      <>
        <p>
          this part comes straight from{" "}
          <ExternalLink href={links.potetoPost} className={link}>
            a post by poteto
          </ExternalLink>{" "}
          on x. the idea is you want most of your effort at the top, on the codebase itself. then
          static analysis. then prose. human review goes last because it's the thing that scales the
          worst.
        </p>
        <p>
          so in rodeo, the codebase does most of the work. on top of that, lint checks everything,
          even the design. if an agent reaches for a color or a size that isn't in the theme, lint
          fails it, so you don't end up with little design papercuts everywhere.
        </p>
        <p>
          agents take the shortest path, every time. left alone, an agent will write a server
          function that trusts whatever the browser sends. in rodeo that fails lint until the
          function checks its input with a schema.
        </p>
        <PyramidFigure />
      </>
    ),
  },
  {
    id: "catching",
    title: "Catching mistakes where they happen",
    Sticker: StaticAnalysisSticker,
    body: (
      <>
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
      </>
    ),
  },
  {
    id: "tokens",
    title: "Spending tokens on signal",
    Sticker: TokenSticker,
    body: (
      <>
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
          never caught anything. a browser test clicks through the app like a person would. it still
          trips when you reword a heading, mine did this week, but when it fails on a flow, a person
          would've hit it too.
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
      </>
    ),
  },
  {
    id: "review",
    title: "You review what matters",
    Sticker: HumanReviewSticker,
    body: (
      <>
        <p>
          i still want to read what the agent wrote and decide whether the feature makes sense. i
          just don't want to spend that time pointing out the same random colors or missing input
          checks.
        </p>
        <p>after a week in a rodeo app i hope you trust your agents a little more.</p>
      </>
    ),
  },
  {
    id: "change",
    title: "This will change",
    Sticker: ScissorsSticker,
    body: (
      <>
        <p>
          none of this is set in stone. models keep getting smarter, and some of these guardrails
          are going to stop pulling their weight.
        </p>
        <p>
          when a guardrail stops catching real mistakes, i'll take it out. rodeo should fit what the
          current frontier models need, not what they needed a year ago.
        </p>
        <p>
          the goal is to keep rodeo as small as it can be. it's free, and ideally it saves you some
          tokens and some review time.
        </p>
      </>
    ),
  },
  {
    id: "thanks",
    title: "Acknowledgements",
    Sticker: HeartSticker,
    body: (
      <>
        <p>
          huge thanks to poteto. the pyramid comes from{" "}
          <ExternalLink href={links.potetoPost} className={link}>
            their post on x
          </ExternalLink>
          , and so does the idea of killing comments.
        </p>
        <p>
          thanks to matt pocock too.{" "}
          <ExternalLink href={pocockSkills} className={link}>
            his skills
          </ExternalLink>{" "}
          and his focus on what matters now that agents write the code helped me narrow rodeo down a
          lot.
        </p>
        <p>
          rodeo is built on{" "}
          {stack.map((tool, index) => (
            <span key={tool.name}>
              <ExternalLink href={tool.href} className={link}>
                {tool.name}
              </ExternalLink>
              {stackSeparator(index)}
            </span>
          ))}{" "}
          thank you all.
        </p>
      </>
    ),
  },
];
