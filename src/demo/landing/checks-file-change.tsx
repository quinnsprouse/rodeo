import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/icon";
import type { DiffLine, Scenario } from "@/demo/landing/checks-scenarios";
import { StatusPill } from "@/demo/landing/status-pill";
import { concealed, reveal } from "@/demo/motion-classes";
import { cn } from "@/lib/utils";

const lineDelays = [
  "delay-0",
  "delay-40",
  "delay-80",
  "delay-120",
  "delay-160",
  "delay-200",
  "delay-240",
  "delay-280",
  "delay-320",
  "delay-360",
];

function diffSummary(lines: DiffLine[]) {
  const count = (kind: DiffLine["kind"]) => lines.filter((line) => line.kind === kind).length;
  const removed = count("removed");
  const added = count("added");
  return [removed > 0 && `−${removed}`, added > 0 && `+${added}`].filter(Boolean).join(" ");
}

export function FileChange({
  scenario,
  shown,
  finished,
}: {
  scenario: Scenario;
  shown: boolean;
  finished: boolean;
}) {
  return (
    <div data-markdown="skip" className="hidden min-w-0 flex-col lg:flex">
      <p
        className={cn(
          "flex items-center gap-xs px-m py-s font-data text-xs text-foreground divider-b",
          reveal,
          !shown && concealed,
        )}
      >
        <span className="truncate">{scenario.file.path}</span>
        <span className="text-muted-foreground">{diffSummary(scenario.file.lines)}</span>
      </p>
      <div className="py-s font-data text-xs leading-6">
        {scenario.file.lines.map((line, index) => (
          <CodeLine
            key={`${line.kind}-${line.number}`}
            line={line}
            className={cn(reveal, lineDelays[index], !shown && concealed)}
          />
        ))}
      </div>
      <StatusPill status={scenario.status} shown={finished} className="mx-auto mt-auto mb-m" />
    </div>
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

function CodeLine({ line, className }: { line: DiffLine; className?: string }) {
  const marker = line.kind === "context" ? undefined : lineMarkers[line.kind];
  return (
    <div className={cn("flex", lineStyles[line.kind], className)}>
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
