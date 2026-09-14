import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vp = join(dirname(require.resolve("vite-plus/package.json")), "bin/vp");
let sandbox: string;

beforeAll(() => {
  mkdirSync(join(repoRoot, ".scratch"), { recursive: true });
  sandbox = mkdtempSync(join(repoRoot, ".scratch", "lint-policy-"));
  writeFileSync(
    join(sandbox, "tsconfig.json"),
    JSON.stringify({ extends: join(repoRoot, "tsconfig.app.json"), include: ["*.tsx"] }),
  );
});

afterAll(() => rmSync(sandbox, { recursive: true, force: true }));

function lint(source: string) {
  const target = join(sandbox, "probe.tsx");
  writeFileSync(target, source);
  // Exercise the project's real configuration, including warnings and suppression policy.
  return spawnSync(process.execPath, [vp, "lint", "--no-ignore", "--format", "json", target], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 20_000,
  });
}

// Compiler startup can exceed the unit-test timeout while CI runs coverage and builds.
describe("Lint policy", { timeout: 30_000 }, () => {
  it.each([
    {
      name: "unexplained empty catch blocks",
      rule: "no-empty",
      source: `export async function save(action: () => Promise<void>) {
  try { await action(); } catch {}
}`,
    },
    {
      name: "checked inputs without a change handler or read-only intent",
      rule: "react(checked-requires-onchange-or-readonly)",
      source: `export function Probe() {
  return <input type="checkbox" aria-label="Notifications" checked />;
}`,
    },
    {
      name: "a function that falls through without returning",
      rule: "typescript(TS7030)",
      source: `export function label(enabled: boolean) {
  if (enabled) return "Ready";
}`,
    },
    {
      name: "a union member hidden by a default case",
      rule: "typescript(switch-exhaustiveness-check)",
      source: `export function label(status: "ready" | "failed") {
  switch (status) {
    case "ready": return "Ready";
    default: return "Unknown";
  }
}`,
    },
    {
      name: "buttons with implicit submit behavior",
      rule: "react(button-has-type)",
      source: `export function Probe() { return <button>Cancel</button>; }`,
    },
    {
      name: "coercive equality comparisons",
      rule: "eqeqeq",
      source: `export function isEqual(left: string | number, right: string | number) {
  return left == right;
}`,
    },
    {
      name: "promise rejections without an Error",
      rule: "typescript(prefer-promise-reject-errors)",
      source: `export function save() { return Promise.reject("Failed to save"); }`,
    },
    {
      name: "missing effect dependencies",
      rule: "react-hooks-js(exhaustive-deps)",
      source: `import { useEffect } from "react";
export function Probe({ title }: { title: string }) {
  useEffect(() => { document.title = title; }, []);
  return null;
}`,
    },
    {
      name: "conditional hooks",
      rule: "react-hooks-js(rules-of-hooks)",
      source: `import { useEffect } from "react";
export function Probe({ enabled }: { enabled: boolean }) {
  if (enabled) useEffect(() => { document.title = "Ready"; }, []);
  return null;
}`,
    },
    {
      name: "derived state synchronized through an effect",
      rule: "react-hooks-js(set-state-in-effect)",
      source: `import { useEffect, useState } from "react";
export function Probe({ name }: { name: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => { setLabel(name.toUpperCase()); }, [name]);
  return <span>{label}</span>;
}`,
    },
    {
      name: "async effect callbacks",
      rule: "react-hooks-js(exhaustive-deps)",
      source: `import { useEffect } from "react";
export function Probe() {
  useEffect(async () => { await Promise.resolve(); }, []);
  return null;
}`,
    },
    {
      name: "raw palette colors outside the theme",
      rule: "shadcn(no-raw-colors)",
      source: `export function Probe() { return <span className="bg-emerald-500" />; }`,
    },
    {
      name: "arbitrary appearance values",
      rule: "shadcn(no-arbitrary-values)",
      source: `export function Probe() { return <p className="text-[13px]">Ready</p>; }`,
    },
    {
      name: "restyling a kit component",
      rule: "shadcn(no-restyle)",
      source: `import { Snippet } from "@/components/ui/snippet";
export function Probe() { return <Snippet text="npm ci" className="bg-brand" />; }`,
    },
    {
      name: "classes Tailwind cannot generate",
      rule: "shadcn(no-unknown-classes)",
      source: `export function Probe() { return <span className="rounded-huge" />; }`,
    },
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
  ])("rejects $name", ({ rule, source }) => {
    const result = lint(source);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(rule);
  });

  it("allows explicit behavior and external synchronization with cleanup", () => {
    const result = lint(`import { useEffect, useState } from "react";
import { Snippet } from "@/components/ui/snippet";
export function Probe({ delay }: { delay: number }) {
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTicks((value) => value + 1), delay);
    return () => window.clearInterval(timer);
  }, [delay]);
  return <button type="button">{ticks}</button>;
}
export function label(status: "ready" | "failed") {
  switch (status) {
    case "ready": return "Ready";
    case "failed": return "Failed";
  }
}
export function isEqual(left: string | number, right: string | number) {
  return left === right;
}
export function isAbsent(value: string | null | undefined) {
  return value == null;
}
export function save() {
  return Promise.reject(new Error("Failed to save"));
}
export async function attempt(action: () => Promise<void>) {
  try { await action(); } catch (error) { console.error(error); }
}
export async function removeCache(remove: () => Promise<void>) {
  try { await remove(); } catch {
    // Cache removal is best-effort; a failure must not block signing out.
  }
}
export function ReadOnly() {
  return <input type="checkbox" aria-label="Notifications" checked readOnly />;
}
export function Editable() {
  const [checked, setChecked] = useState(false);
  return <input type="checkbox" aria-label="Notifications" checked={checked}
    onChange={(event) => setChecked(event.currentTarget.checked)} />;
}
export function Themed() {
  return (
    <>
      <Snippet text="npm ci" className="mt-4 w-full" />
      <p className="text-sm leading-relaxed text-success">Ready</p>
    </>
  );
}`);
    expect(result.stdout).toMatch(/"diagnostics":\s*\[\]/);
    expect(result.status).toBe(0);
  });
});
