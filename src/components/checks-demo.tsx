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
            className="grid lg:min-h-120 lg:grid-cols-[18rem_1fr]"
          >
            <Conversation scenario={scenario} />
            <FileChange scenario={scenario} />
          </Tabs.Panel>
        ))}
      </div>

      <Tabs.List aria-label="When Rodeo checks" className="flex rounded-full bg-muted p-xxs">
        {scenarios.map((scenario) => (
          <Tabs.Tab
            key={scenario.value}
            value={scenario.value}
            className="h-9 rounded-full px-s text-s font-medium text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground data-active:bg-background data-active:text-foreground data-active:ring data-active:ring-border sm:px-m"
          >
            <span className="xs:hidden">{scenario.shortLabel}</span>
            <span className="max-xs:hidden">{scenario.label}</span>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
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
            <span className="font-medium break-words text-foreground">{scenario.caught.title}</span>
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
    <div className="hidden min-w-0 flex-col lg:flex">
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
