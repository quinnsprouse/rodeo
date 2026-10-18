import { Tabs } from "@base-ui/react/tabs";
import { useEffect, useRef, useState } from "react";

import { FileChange } from "@/components/checks-file-change";
import { concealed, iconOut, iconSwap, reveal, StatusPill } from "@/components/checks-motion";
import { scenarios, type Scenario } from "@/components/checks-scenarios";
import { ArrowUp02Icon, Icon, Loading03Icon, PlusSignIcon, Tick02Icon } from "@/components/icons";
import { BullSticker } from "@/components/stickers/hero";
import { useBeats } from "@/hooks/use-beats";
import { usePlayOnView, type Playback } from "@/hooks/use-play-on-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

function playbackFor(reducedMotion: boolean, switched: boolean, entrance: Playback): Playback {
  if (reducedMotion) return "static";
  return switched ? "playing" : entrance;
}

export function ChecksDemo({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const windowRef = useRef<HTMLDivElement>(null);
  const entrance = usePlayOnView(windowRef, !reducedMotion);
  const [switched, setSwitched] = useState(false);
  const playback = playbackFor(reducedMotion, switched, entrance);

  return (
    <Tabs.Root
      defaultValue={scenarios[0]?.value}
      onValueChange={() => setSwitched(true)}
      className={cn("flex flex-col items-center gap-l", className)}
    >
      <div
        ref={windowRef}
        className="w-full overflow-hidden rounded-l bg-background ring ring-border dark:ring-neutral-4"
      >
        <div className="relative flex items-center gap-xs bg-card px-m py-s divider-b">
          <span className="size-2.5 rounded-full bg-neutral-4" />
          <span className="size-2.5 rounded-full bg-neutral-4" />
          <span className="size-2.5 rounded-full bg-neutral-4" />
          <span className="absolute inset-x-0 text-center text-xs text-muted-foreground">
            my-app — Claude Code
          </span>
        </div>
        {scenarios.map((scenario) => (
          <Tabs.Panel
            key={scenario.value}
            value={scenario.value}
            className="grid data-ending-style:hidden lg:min-h-120 lg:grid-cols-[18rem_1fr]"
          >
            <ScenarioPanel scenario={scenario} playback={playback} />
          </Tabs.Panel>
        ))}
      </div>

      <Tabs.List
        aria-label="When Rodeo checks"
        data-markdown="skip"
        className="relative flex rounded-full bg-muted p-xxs"
      >
        {scenarios.map((scenario) => (
          <Tabs.Tab
            key={scenario.value}
            value={scenario.value}
            className={cn(
              tabFace,
              "text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground noscript:data-active:bg-background noscript:data-active:text-foreground noscript:data-active:ring noscript:data-active:ring-border",
            )}
          >
            <TabLabel scenario={scenario} />
          </Tabs.Tab>
        ))}
        <Tabs.Indicator
          renderBeforeHydration
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <span className="absolute inset-0 bg-border clip-to-active-tab clip-outset-border" />
          <span className="absolute inset-0 flex bg-background p-xxs text-foreground clip-to-active-tab">
            {scenarios.map((scenario) => (
              <span key={scenario.value} className={tabFace}>
                <TabLabel scenario={scenario} />
              </span>
            ))}
          </span>
        </Tabs.Indicator>
      </Tabs.List>
    </Tabs.Root>
  );
}

const tabFace = "flex h-9 items-center rounded-full px-s text-s font-medium sm:px-m";

function TabLabel({ scenario }: { scenario: Scenario }) {
  return (
    <>
      <span className="xs:hidden">{scenario.shortLabel}</span>
      <span className="max-xs:hidden">{scenario.label}</span>
    </>
  );
}

const timing = { prompt: 300, step: 380, caught: 850, fix: 500, result: 250 };

function storyline(scenario: Scenario) {
  const caught = 1 + scenario.stepsBefore.length;
  const fix = caught + 1;
  const result = fix + scenario.stepsAfter.length;
  const durations = [
    timing.prompt,
    ...scenario.stepsBefore.map(() => timing.step),
    timing.caught,
    ...scenario.stepsAfter.map(() => timing.fix),
    timing.result,
  ];
  return { caught, fix, result, durations };
}

type Storyline = ReturnType<typeof storyline>;
type StepState = "hidden" | "working" | "done";

const focusInset = 4;

function isWorking(story: Storyline, beat: number) {
  const before = beat >= 1 && beat < story.caught;
  const after = beat >= story.fix && beat < story.result;
  return before || after;
}

function stepState(index: number, beat: number): StepState {
  if (beat < index) return "hidden";
  return beat === index ? "working" : "done";
}

function ScenarioPanel({ scenario, playback }: { scenario: Scenario; playback: Playback }) {
  const story = storyline(scenario);
  const beat = useBeats(story.durations, playback);

  return (
    <>
      <Conversation scenario={scenario} story={story} beat={beat} />
      <FileChange scenario={scenario} shown={beat >= story.fix} finished={beat >= story.result} />
    </>
  );
}

function Conversation({
  scenario,
  story,
  beat,
}: {
  scenario: Scenario;
  story: Storyline;
  beat: number;
}) {
  const steps = useRef<HTMLUListElement>(null);
  const focus = useRef<HTMLSpanElement>(null);
  const working = isWorking(story, beat);
  const activeStep = working ? beat : -1;

  useEffect(() => {
    const row = steps.current?.querySelector<HTMLElement>(`[data-step="${activeStep}"]`);
    const highlight = focus.current;
    if (!row || !highlight) return;
    highlight.style.setProperty("--row-top", `${row.offsetTop - focusInset}px`);
    highlight.style.setProperty("--row-height", `${row.offsetHeight + focusInset * 2}px`);
  }, [activeStep]);

  return (
    <div className="flex flex-col gap-m p-m lg:divider-r">
      <p
        className={cn(
          "rounded-l bg-muted px-s py-s text-s text-foreground",
          reveal,
          beat < 0 && "translate-y-3 scale-97 opacity-0 blur-xs",
        )}
      >
        {scenario.prompt}
      </p>
      <ul ref={steps} className="relative isolate flex flex-col gap-xs text-s">
        <span
          ref={focus}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 follow-active-row rounded-m bg-muted",
            !working && "opacity-0",
          )}
        />
        {scenario.stepsBefore.map((step, index) => (
          <Step key={step} index={index + 1} text={step} state={stepState(index + 1, beat)} />
        ))}
        <CaughtCard caught={scenario.caught} shown={beat >= story.caught} />
        {scenario.stepsAfter.map((step, index) => (
          <Step
            key={step}
            index={story.fix + index}
            text={step}
            state={stepState(story.fix + index, beat)}
          />
        ))}
        <Step
          index={story.result}
          text={scenario.result}
          state={beat >= story.result ? "done" : "hidden"}
          final
        />
      </ul>
      <StatusPill
        status={scenario.status}
        shown={beat >= story.result}
        className="self-center lg:hidden"
      />
      <Composer working={beat >= 0 && beat < story.result} />
    </div>
  );
}

function Step({
  index,
  text,
  state,
  final = false,
}: {
  index: number;
  text: string;
  state: StepState;
  final?: boolean;
}) {
  const working = state === "working";
  return (
    <li
      data-step={index}
      className={cn("flex gap-xs px-xs", reveal, state === "hidden" && concealed)}
    >
      <span aria-hidden="true" className="relative mt-0.5 size-4 shrink-0">
        <Icon
          icon={Loading03Icon}
          className={cn(
            "absolute inset-0 size-4 animate-spin text-primary",
            iconSwap,
            !working && iconOut,
          )}
        />
        <Icon
          icon={Tick02Icon}
          className={cn(
            "absolute inset-0 size-4 text-muted-foreground",
            iconSwap,
            working && iconOut,
          )}
        />
      </span>
      {working ? (
        <span className="shimmer-text text-muted-foreground" data-text={text}>
          {text}
        </span>
      ) : (
        <span className={final ? "text-foreground" : "text-muted-foreground"}>{text}</span>
      )}
    </li>
  );
}

function CaughtCard({ caught, shown }: { caught: Scenario["caught"]; shown: boolean }) {
  return (
    <li
      className={cn(
        "flex gap-xs rounded-m bg-destructive/10 px-xs py-xs ring ring-destructive/30",
        reveal,
        !shown && concealed,
      )}
    >
      <BullSticker
        className={cn(
          "-my-0.5 -ml-0.5 size-6 delay-150",
          reveal,
          !shown && "scale-150 -rotate-12 opacity-0",
        )}
      />
      <span className="flex min-w-0 flex-col">
        <span className="font-medium break-words text-foreground">
          {caught.title}
          <span className="sr-only">. </span>
        </span>
        <span className="text-muted-foreground">{caught.detail}</span>
      </span>
    </li>
  );
}

function Composer({ working }: { working: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="mt-auto flex flex-col gap-s rounded-l p-s text-s text-muted-foreground ring ring-border max-lg:hidden dark:ring-neutral-4"
    >
      Ask for a change…
      <span className="flex items-center justify-between">
        <Icon icon={PlusSignIcon} className="size-4" />
        <span className="relative flex size-6 items-center justify-center rounded-full bg-muted">
          <Icon icon={ArrowUp02Icon} className={cn("size-3.5", iconSwap, working && iconOut)} />
          <span
            className={cn("absolute size-2 rounded-xs bg-current", iconSwap, !working && iconOut)}
          />
        </span>
      </span>
    </div>
  );
}
