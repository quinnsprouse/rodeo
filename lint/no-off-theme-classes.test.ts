import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { lint, probe, rulesHit } = ruleProbes();

describe("no-off-theme-classes", () => {
  const offTheme = probe(`
import { cva } from "class-variance-authority";
const cn = (...classes: unknown[]) => classes.join(" ");
export const variants = cva("border-b-2 hover:transition-all", {
  variants: { size: { wide: "max-inline-xl", narrow: "min-inline-xs" } },
});
export function Probe({ className }: { className?: string }) {
  return (
    <div className={cn("md:border outline-none", className)}>
      <span className={\`border-x \${className ?? ""}\`} />
      <span className="focus:outline-hidden inline-xl" />
    </div>
  );
}`);
  it("reports each class that bypasses the theme, in attributes and class helpers", () => {
    expect(lint(offTheme).map((hit) => hit.message.split('"')[1])).toEqual([
      "border-b-2",
      "hover:transition-all",
      "max-inline-xl",
      "min-inline-xs",
      "md:border",
      "outline-none",
      "border-x",
      "focus:outline-hidden",
      "inline-xl",
    ]);
  });

  it("names the replacement for a shadowed logical size", () => {
    expect(lint(offTheme)[2]?.message).toContain(
      "Write max-w-xl for the container width, or max-inline-(--spacing-xl) for the spacing value.",
    );
  });

  const themed = probe(`
import { cva } from "class-variance-authority";
const cn = (...classes: unknown[]) => classes.join(" ");
export const variants = cva("ring-1 ring-border divider-b transition-colors border-0", {
  variants: { border: { none: "inset-ring" } },
});
export function Probe({ edge }: { edge: string }) {
  return (
    <div className={cn("outline-none focus-visible:ring-2", edge === "border" && "divider-t")}>
      <span className="max-inline-(--spacing-xl) inline-m max-w-xl border-input" />
    </div>
  );
}
export const label = "border transition-all";`);
  it("allows themed edges, named transitions, a replaced outline, and strings outside class lists", () => {
    expect(rulesHit(themed)).toEqual([]);
  });
});
