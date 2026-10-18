import { useRef } from "react";

import { Figure } from "@/components/figures/figure";
import { useBeats } from "@/hooks/use-beats";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { concealed, iconOut, iconSwap, reveal } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

type LineKind = "edit" | "error" | "hint" | "pass";

const lines: { id: string; kind: LineKind; text: string; detail?: string; retried?: boolean }[] = [
  { id: "first-edit", kind: "edit", text: "Edit src/routes/pricing.tsx", retried: true },
  { id: "error", kind: "error", text: "rodeo/no-comments", detail: "line 14", retried: true },
  {
    id: "hint",
    kind: "hint",
    text: "Comments are not allowed. Make the code say it: a clearer name, a smaller function, a type, or a test.",
    retried: true,
  },
  { id: "second-edit", kind: "edit", text: "Edit src/routes/pricing.tsx" },
  { id: "pass", kind: "pass", text: "Format, lint, and types pass" },
];

const beats = [500, 650, 1000, 600, 450];

const markers: Partial<Record<LineKind, { glyph: string; className: string }>> = {
  edit: { glyph: "●", className: "text-primary" },
  error: { glyph: "✗", className: "text-destructive" },
  pass: { glyph: "✓", className: "text-success" },
};

const indents: Record<LineKind, string> = {
  edit: "text-foreground",
  error: "pl-l text-foreground",
  hint: "pl-xxl text-muted-foreground",
  pass: "pl-l text-muted-foreground",
};

export function TerminalFigure() {
  const terminal = useRef<HTMLDivElement>(null);
  const playback = useScrollPlayback(terminal);
  const beat = useBeats(beats, playback);
  const settled = beat >= lines.length;

  return (
    <Figure
      caption="the error says how to fix it, so the agent fixes it before you ever see the diff."
      waiting={playback === "waiting"}
    >
      <div
        ref={terminal}
        className="dark overflow-hidden rounded-l bg-card text-card-foreground ring ring-border"
      >
        <div className="relative flex items-center gap-xs px-m py-s divider-b">
          <span className="size-2.5 rounded-full bg-neutral-4" />
          <span className="size-2.5 rounded-full bg-neutral-4" />
          <span className="size-2.5 rounded-full bg-neutral-4" />
          <span className="absolute inset-x-0 text-center font-data text-xs text-muted-foreground">
            my-app — Claude Code
          </span>
        </div>

        <div className="space-y-xxs p-m font-data text-xs sm:px-l">
          {lines.map((line, index) => {
            const marker = markers[line.kind];
            const hidden = beat < index;
            return (
              <div
                key={line.id}
                className={cn(
                  "flex items-baseline gap-xs",
                  indents[line.kind],
                  line.id === "second-edit" && "pt-s",
                  reveal,
                  hidden && concealed,
                  settled && line.retried && "text-muted-foreground",
                )}
              >
                {marker && (
                  <span
                    className={cn(
                      "inline-block delay-100 select-none",
                      marker.className,
                      iconSwap,
                      hidden && iconOut,
                      beat === index && line.kind === "edit" && "animate-pulse",
                    )}
                  >
                    {marker.glyph}
                  </span>
                )}
                <span>{line.text}</span>
                {line.detail && <span className="text-muted-foreground">{line.detail}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </Figure>
  );
}
