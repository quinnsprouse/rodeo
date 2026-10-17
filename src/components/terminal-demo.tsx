import { cn } from "@/lib/utils";

type LineKind = "edit" | "error" | "hint" | "pass";

const lines: { id: string; kind: LineKind; text: string; detail?: string }[] = [
  { id: "first-edit", kind: "edit", text: "Edit src/routes/pricing.tsx" },
  { id: "error", kind: "error", text: "rodeo/no-comments", detail: "line 14" },
  {
    id: "hint",
    kind: "hint",
    text: "Comments are not allowed. Make the code say it: a clearer name, a smaller function, a type, or a test.",
  },
  { id: "second-edit", kind: "edit", text: "Edit src/routes/pricing.tsx" },
  { id: "pass", kind: "pass", text: "Format, lint, and types pass" },
];

const markers: Partial<Record<LineKind, { glyph: string; className: string }>> = {
  edit: { glyph: "●", className: "text-primary" },
  error: { glyph: "✗", className: "text-destructive" },
  pass: { glyph: "✓", className: "text-success" },
};

export function TerminalDemo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "dark overflow-hidden rounded-l bg-card text-card-foreground ring ring-border",
        className,
      )}
    >
      <div className="flex items-center gap-xs px-m py-s divider-b">
        <span className="size-2.5 rounded-full bg-neutral-4" />
        <span className="size-2.5 rounded-full bg-neutral-4" />
        <span className="size-2.5 rounded-full bg-neutral-4" />
        <span className="ml-xs font-data text-xs text-muted-foreground">my-app — claude</span>
      </div>

      <div className="space-y-xxs p-m font-data text-xs sm:px-l">
        {lines.map((line) => {
          const marker = markers[line.kind];
          return (
            <div
              key={line.id}
              className={cn(
                "flex reveal-on-scroll items-baseline gap-xs",
                line.kind === "edit" && "text-foreground",
                line.id === "second-edit" && "pt-s",
                line.kind === "error" && "pl-l text-foreground",
                line.kind === "hint" && "pl-xxl text-muted-foreground",
                line.kind === "pass" && "pl-l text-muted-foreground",
              )}
            >
              {marker && (
                <span className={cn("select-none", marker.className)}>{marker.glyph}</span>
              )}
              <span>{line.text}</span>
              {line.detail && <span className="text-muted-foreground">{line.detail}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
