import { type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "inline dependency suppressions",
    rule: "rodeo(no-disable-directives)",
    source: `/* oxlint-disable react-hooks-js/exhaustive-deps */
import { useEffect } from "react";
export function Probe({ title }: { title: string }) {
useEffect(() => { document.title = title; }, []);
return null;
}`,
  },
  {
    name: "TODO notes, even behind why:",
    rule: "eslint(no-warning-comments)",
    source: `// why: TODO handle the error case later.\nexport const title = "Rodeo";`,
  },
  {
    name: "functions with too many branches",
    rule: "eslint(complexity)",
    source: `export function grade(score: number) {
${Array.from({ length: 21 }, (_, index) => `  if (score === ${index}) return "${index}";`).join("\n")}
return "none";
}`,
  },
  {
    name: "deeply nested blocks",
    rule: "eslint(max-depth)",
    source: `export function walk(flags: boolean[]) {
if (flags[0]) { if (flags[1]) { if (flags[2]) { if (flags[3]) { if (flags[4]) { return 1; } } } } }
return 0;
}`,
  },
  {
    name: "import cycles",
    rule: "import(no-cycle)",
    file: "cycle-probe.tsx",
    source: `import { partnerValue } from "./cycle-partner";
export const probeValue = 1;
export const total = partnerValue;`,
    extraFiles: {
      "cycle-partner.tsx": `import { probeValue } from "./cycle-probe";
export const partnerValue = probeValue + 1;`,
    },
  },
  {
    name: "oversized source files",
    rule: "eslint(max-lines)",
    layer: "src/lib",
    source: Array.from(
      { length: 301 },
      (_, index) => `export const value${index} = ${index};`,
    ).join("\n"),
  },
  {
    name: "oversized files outside src, such as tests and tooling",
    rule: "eslint(max-lines)",
    layer: "e2e",
    file: "oversized-helper.ts",
    source: Array.from(
      { length: 301 },
      (_, index) => `export const value${index} = ${index};`,
    ).join("\n"),
  },
];

export const codeShapeProbes: PolicyTopic = { rejected };
