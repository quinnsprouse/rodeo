import { Link } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";

import {
  BeforeAfterFigure,
  EscapeHatchesFigure,
  PyramidFigure,
  TerminalFigure,
  TokenBarsFigure,
  UpkeepFigure,
} from "@/components/rationale-figures";
import type { StickerProps } from "@/components/stickers/frame";
import { HeartSticker, ScissorsSticker, TokenSticker } from "@/components/stickers/rationale";
import {
  CodebaseSticker,
  HumanReviewSticker,
  OneWaySticker,
  StaticAnalysisSticker,
} from "@/components/stickers/topics";

export const rationaleSections = [
  { id: "teaching", title: "Teaching through the codebase" },
  { id: "catching", title: "Catching mistakes where they happen" },
  { id: "tokens", title: "Spending tokens on signal" },
  { id: "way-out", title: "One way out" },
  { id: "review", title: "You review what matters" },
  { id: "change", title: "This will change" },
  { id: "thanks", title: "Acknowledgements" },
] as const;

type SectionId = (typeof rationaleSections)[number]["id"];

const potetoPost = "https://x.com/poteto/status/2111133080526495985";
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
        <p className="text-muted-foreground">17 October, 2026</p>
      </header>

      <div className="space-y-m">
        <p>
          rodeo is a react starter for building with agents. you clone it, point claude code or
          codex at it, and the agent writes pretty good code on the first try. most of the time
          anyway.
        </p>
        <p>
          i built rodeo for myself. as agents got better, i started building more and more web apps
          with them, and i needed a solid foundation to build all of them off of.
        </p>
        <p>
          and the better agents got, the more the way i worked had to change. i kept picking up new
          practices so i could focus on what really mattered in a project, instead of getting
          frustrated, waiting forever for an agent to finish, and still not being sure the software
          would hold up.
        </p>
        <p>
          the thing i kept running into is that agents are really good at copying whatever's already
          in your codebase. if it's messy you get more mess, just faster. if it's clean and strict,
          you get clean and strict.
        </p>
        <p>
          rodeo is where all of that ended up. it's the starting place i wanted for any web app,
          something durable and reliable from day one.
        </p>
        <p>
          this isn't a setup guide, the readme has that. it's more about how i think about building
          with agents, and why rodeo drops a few habits you're probably used to, like comments and
          unit tests.
        </p>
        <p>
          everything in rodeo comes back to three ideas: teach with the codebase, catch mistakes
          where they happen, and spend tokens on signal.
        </p>
        <p>
          none of them are new honestly. agents just made them matter a lot more, because an agent
          will happily repeat anything you let slide.
        </p>
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
          so within rodeo, the foundation does most of the work. on top of that, lint checks
          everything, even the design. if an agent reaches for a color or a size that isn't in the
          theme, lint fails it, so you don't end up with little design papercuts everywhere. and
          every lint error tells the agent how to fix it. then there are seven short guides an agent
          only reads when it needs one. and then you, looking at whatever's left.
        </p>
        <p>
          the trick is making the easy thing the right thing. agents take the shortest path, every
          time. so if the shortest path is importing server code into a component, that's exactly
          what you'll get. in rodeo that import fails the build, so the shortest path goes somewhere
          better.
        </p>
        <PyramidFigure />
        <p>
          there's also{" "}
          <Link to="/example" className={link}>
            one real example
          </Link>{" "}
          to copy, a page that loads data through a server function and handles the error when it
          fails. agents are going to copy something anyway, so you might as well give them something
          good.
        </p>
        <p>
          if your first instinct is a longer AGENTS.md, i get it, mine was too. but every line you
          add there is a suggestion. a lint rule isn't.
        </p>
      </Section>

      <Section id="catching" Sticker={StaticAnalysisSticker}>
        <p>
          an agent is at its best right after it writes something. the file's open, the context is
          fresh, and fixing it costs one more edit. the same mistake caught in review costs you a
          whole round trip.
        </p>
        <p>
          so rodeo checks all the time. every edit gets formatted, linted and typechecked. the end
          of a turn checks everything that changed. commits check the staged files, pushes build the
          app and run every browser test, and CI starts from a clean install and does it all again.
        </p>
        <p>
          the fast checks only look at the file the agent just touched, so they come back quick. the
          slow stuff, building the whole app and running browser tests, waits until you push, when
          you're done anyway.
        </p>
        <TerminalFigure />
        <p>
          that's the other thing. every error names its fix. an error that just says no teaches the
          agent to sneak around it. one that says "use a clearer name" teaches it what you actually
          wanted.
        </p>
        <p>
          it sounds small but it changes how the whole thing feels. you stop finding the same
          mistake in every review, because the agent already heard about it the second it wrote it.
        </p>
      </Section>

      <Section id="tokens" Sticker={TokenSticker}>
        <p>
          agents read everything you give them. every comment, every test, every doc. all of it
          costs context they could be spending on the actual task.
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
          <sup>
            <a href="#footnotes" className="text-muted-foreground">
              1
            </a>
          </sup>
        </p>
        <p>
          if the code needs explaining, explain it in code. a better name, a smaller function, a
          type. and if none of that works, it's usually a workaround, and the fix is fixing it, not
          writing about it.
        </p>
        <BeforeAfterFigure />
        <Subheading>Unit tests</Subheading>
        <p>
          agents love writing tests like "the header says welcome". then you change the header, the
          test fails even though nothing broke, and the agent burns tokens rewriting a test that
          never caught anything. a browser test clicks through the app like a person would, so when
          it fails, something's actually broken.
        </p>
        <p>
          browser tests are slower, sure. but you need way fewer of them, they test what people
          actually do, and they don't fall over every time you rename something.
        </p>
        <Subheading>Docs</Subheading>
        <p>
          rodeo has seven short guides and that's it. an agent opens one when the task needs it. a
          hook blocks new docs anywhere else, because docs go stale and agents trust them anyway.
        </p>
        <p>
          if something can be a lint rule, it's a lint rule. docs are for the stuff code can't say.
        </p>
      </Section>

      <Section id="way-out" Sticker={OneWaySticker}>
        <p>
          every rule needs a way out, or agents find their own, and theirs is usually worse. so each
          rule in rodeo has exactly one exit, and it always makes you leave a reason behind.
        </p>
        <p>
          inline disable comments are just banned. if a rule is wrong for a file, the exception goes
          in vite.config.ts with a why: comment. it's all in one file, so it's easy to see
          everything that's been bent, and why.
        </p>
        <EscapeHatchesFigure />
        <p>
          and when an agent makes the same mistake twice, it becomes a rule, not another paragraph
          in a doc. that's pretty much how rodeo got built.
        </p>
      </Section>

      <Section id="review" Sticker={HumanReviewSticker}>
        <p>
          none of this is about taking people out of the loop. it's about what you spend your
          attention on. if the codebase catches the comments and the random colors and the
          unvalidated inputs, your review goes to the stuff that actually needs a person.
        </p>
        <p>
          you still review, obviously. but instead of writing "please don't add a comment here" for
          the hundredth time, you're looking at whether the feature actually makes sense.
        </p>
        <p>
          after a week in a rodeo app i hope you trust your agents a little more. and maybe sleep a
          bit better.
        </p>
      </Section>

      <Section id="change" Sticker={ScissorsSticker}>
        <p>
          none of this is set in stone. models keep getting smarter, and some of these guardrails
          are going to stop pulling their weight. a rule that saves an agent today might just be
          noise for the next model.
        </p>
        <p>
          so here's my commitment: when a guardrail stops catching real mistakes, i'll take it out.
          rodeo should fit what the current frontier models need, not what they needed a year ago.
        </p>
        <p>
          the whole point is to stay as lean as possible. give agents exactly what they need and
          nothing they don't. ideally rodeo just saves you time and money, and it's free.
        </p>
      </Section>

      <Section id="thanks" Sticker={HeartSticker}>
        <p>
          huge thanks to poteto. the pyramid comes from{" "}
          <a href={potetoPost} target="_blank" rel="noopener noreferrer" className={link}>
            their post on x
          </a>
          , and so does the idea of killing comments. thanks to graphical for the theme and the
          stickers, and to benji, whose family values post is why this page looks like this.
        </p>
        <p>
          rodeo stands on vite+, tanstack start, react, tailwind, shadcn/ui, base ui and nitro.
          thank you all.
        </p>
      </Section>

      <footer id="footnotes" className="scroll-mt-xl pt-xxl text-s">
        <h2 className="font-medium text-foreground">Footnotes</h2>
        <p className="mt-xs text-muted-foreground">
          1. the one exception is a why: comment that names the library, browser or spec that forces
          the code. lint checks that it does.
        </p>
      </footer>
    </article>
  );
}
