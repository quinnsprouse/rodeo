import { Tabs } from "@base-ui/react/tabs";

import { scenarios, type DiffLine, type Scenario } from "@/components/checks-scenarios";
import { ArrowUp02Icon, Icon, MinusSignIcon, PlusSignIcon, Tick02Icon } from "@/components/icons";
import { BullSticker } from "@/components/stickers/hero";
import { cn } from "@/lib/utils";

export function ChecksDemo({ className }: { className?: string }) {
  return (
    <Tabs.Root
      defaultValue={scenarios[0]?.value}
      className={cn("flex flex-col items-center gap-l", className)}
    >
      <div className="w-full overflow-hidden rounded-l bg-background ring ring-border dark:ring-neutral-4">
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
            className="grid data-ending-style:hidden data-starting-style:opacity-0 motion-safe:transition-opacity motion-safe:duration-(--motion-large-duration) motion-safe:ease-(--motion-large-easing) lg:min-h-120 lg:grid-cols-[18rem_1fr]"
          >
            <Conversation scenario={scenario} />
            <FileChange scenario={scenario} />
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

function Conversation({ scenario }: { scenario: Scenario }) {
  return (
    <div className="flex flex-col gap-m p-m lg:divider-r">
      <p className="rounded-l bg-muted px-s py-s text-s text-foreground">{scenario.prompt}</p>
      <ul className="flex flex-col gap-xs text-s">
        {scenario.stepsBefore.map((step) => (
          <Step key={step} text={step} />
        ))}
        <li className="flex gap-xs rounded-m bg-destructive/10 px-xs py-xs ring ring-destructive/30">
          <BullSticker className="-my-0.5 -ml-0.5 size-6" />
          <span className="flex min-w-0 flex-col">
            <span className="font-medium break-words text-foreground">
              {scenario.caught.title}
              <span className="sr-only">. </span>
            </span>
            <span className="text-muted-foreground">{scenario.caught.detail}</span>
          </span>
        </li>
        {scenario.stepsAfter.map((step) => (
          <Step key={step} text={step} />
        ))}
        <Step text={scenario.result} done />
      </ul>
      <StatusPill status={scenario.status} className="self-center lg:hidden" />
      <div
        aria-hidden="true"
        className="mt-auto flex flex-col gap-s rounded-l p-s text-s text-muted-foreground ring ring-border max-lg:hidden dark:ring-neutral-4"
      >
        Ask for a change…
        <span className="flex items-center justify-between">
          <Icon icon={PlusSignIcon} className="size-4" />
          <span className="flex size-6 items-center justify-center rounded-full bg-muted">
            <Icon icon={ArrowUp02Icon} className="size-3.5" />
          </span>
        </span>
      </div>
    </div>
  );
}

function Step({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <li className="flex gap-xs px-xs">
      <Icon
        icon={Tick02Icon}
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    </li>
  );
}

function FileChange({ scenario }: { scenario: Scenario }) {
  return (
    <div data-markdown="skip" className="hidden min-w-0 flex-col lg:flex">
      <p className="flex items-center gap-xs px-m py-s font-data text-xs text-foreground divider-b">
        <span className="truncate">{scenario.file.path}</span>
        <span className="text-muted-foreground">{scenario.file.summary}</span>
      </p>
      <div className="py-s font-data text-xs leading-6">
        {scenario.file.lines.map((line) => (
          <CodeLine key={`${line.kind}-${line.number}`} line={line} />
        ))}
      </div>
      <StatusPill status={scenario.status} className="mx-auto mt-auto mb-m" />
    </div>
  );
}

function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <p
      data-markdown="skip"
      className={cn(
        "dark flex w-fit items-center gap-s rounded-full bg-card py-xxs pr-m pl-xs text-s text-card-foreground ring ring-border",
        className,
      )}
    >
      <BullSticker className="size-8" />
      <span className="font-medium">Rodeo</span>
      <span className="flex items-center gap-xxs text-muted-foreground">
        <Icon icon={Tick02Icon} className="size-4 text-success" aria-hidden="true" />
        {status}
      </span>
    </p>
  );
}

const lineStyles: Record<DiffLine["kind"], string> = {
  context: "text-foreground",
  removed: "bg-destructive/10 text-muted-foreground",
  added: "bg-success/15 text-foreground",
};

const lineMarkers = {
  removed: { icon: MinusSignIcon, label: "Removed:", className: "text-destructive" },
  added: { icon: PlusSignIcon, label: "Added:", className: "text-success" },
};

function CodeLine({ line }: { line: DiffLine }) {
  const marker = line.kind === "context" ? undefined : lineMarkers[line.kind];
  return (
    <div className={cn("flex", lineStyles[line.kind])}>
      <span className="w-10 shrink-0 pr-xs text-right text-muted-foreground tabular-nums select-none">
        {line.number}
      </span>
      <span className="flex w-6 shrink-0 items-center justify-center">
        {marker && (
          <>
            <Icon
              icon={marker.icon}
              className={cn("size-3", marker.className)}
              aria-hidden="true"
            />
            <span className="sr-only">{marker.label}</span>
          </>
        )}
      </span>
      <code className="pr-m whitespace-pre">{line.code || " "}</code>
    </div>
  );
}
