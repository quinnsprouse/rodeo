import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

import { beforeAll, describe, it } from "vite-plus/test";

import { appUnitTestReason, scratchDirectory } from "#tooling/project";

import { diagnosticsByFile, ignoredByGit, repoRoot, runJson, withSandbox } from "./harness";

type Probe = {
  name: string;
  source: string;
  layer?: string;
  file?: string;
  extraFiles?: Record<string, string>;
};
type RejectedProbe = Probe & { rule: string; help?: string };

const require = createRequire(import.meta.url);
const vp = join(dirname(require.resolve("vite-plus/package.json")), "bin/vp");
const sandboxPrefix = "lint-policy-";
const layerPrefix = ".policy-probe-";
const layerProbeName = `${layerPrefix}${process.pid}`;
const appDeclarations = join(repoRoot, "src", "types", "*.d.ts");
const kitStandIn = `@/components/ui/${layerProbeName}/probe-button`;
const appStandIn = `@/components/${layerProbeName}/probe-badge`;

const standIns: Probe[] = [
  {
    name: "a kit component",
    layer: "src/components/ui",
    file: "probe-button.tsx",
    source: `import type { ComponentProps } from "react";
export function ProbeButton(props: ComponentProps<"button">) {
  return <button type="button" {...props} />;
}`,
  },
  {
    name: "an app component",
    layer: "src/components",
    file: "probe-badge.tsx",
    source: `export function ProbeBadge() { return <span aria-hidden="true" />; }`,
  },
];

const rejected: RejectedProbe[] = [
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
    name: "components React Compiler cannot compile",
    rule: "react-hooks-js(todo)",
    source: `import { lazy } from "react";
export function Probe() {
const Panel = lazy(() => import("./panel"));
return <Panel />;
}`,
  },
  {
    name: "raw palette colors outside the theme",
    rule: "shadcn(no-raw-colors)",
    source: `export function Probe() { return <span className="bg-emerald-500" />; }`,
  },
  {
    name: "hex colors in app components",
    rule: "shadcn(no-raw-colors)",
    layer: "src/components",
    source: `export function Probe() { return <svg aria-hidden="true"><path fill="#863bff" d="M0 0h4v4z" /></svg>; }`,
  },
  {
    name: "arbitrary appearance values",
    rule: "shadcn(no-arbitrary-values)",
    source: `export function Probe() { return <p className="text-[13px]">Ready</p>; }`,
  },
  {
    name: "padding on a kit component, even from the theme scale",
    rule: "shadcn(no-restyle)",
    source: `import { ProbeButton } from "${kitStandIn}";
export function Probe() { return <ProbeButton className="px-l">Save</ProbeButton>; }`,
  },
  {
    name: "restyling a kit component",
    rule: "shadcn(no-restyle)",
    source: `import { ProbeButton } from "${kitStandIn}";
export function Probe() { return <ProbeButton className="bg-brand">Save</ProbeButton>; }`,
  },
  {
    name: "inline style properties",
    rule: "shadcn(no-inline-styles)",
    source: `export function Probe({ value }: { value: number }) { return <div style={{ width: \`\${value}%\` }} />; }`,
  },
  {
    name: "Tailwind default scales the theme replaced",
    rule: "shadcn(no-unknown-classes)",
    source: `export function Probe() { return <p className="text-sm font-bold">Ready</p>; }`,
  },
  {
    name: "classes Tailwind cannot generate",
    rule: "shadcn(no-unknown-classes)",
    source: `export function Probe() { return <span className="rounded-huge" />; }`,
  },
  {
    name: "Promise methods called with extra arguments",
    rule: "typescript(TS2554)",
    source: `export const settled = Promise.resolve(1).catch(() => 0, () => 1);`,
  },
  {
    name: "classic Zod imports",
    rule: "eslint(no-restricted-imports)",
    source: `import { z } from "zod";
export const schema = z.object({ id: z.string() });`,
  },
  {
    name: "icon libraries other than Hugeicons, at any import depth",
    rule: "eslint(no-restricted-imports)",
    source: `import { CheckIcon } from "@heroicons/react/24/outline";
export function Probe() { return <CheckIcon aria-hidden="true" />; }`,
  },
  {
    name: "skeleton libraries other than skullet",
    rule: "eslint(no-restricted-imports)",
    source: `import LoadingSkeleton from "react-loading-skeleton";
export function Probe() { return <LoadingSkeleton count={3} />; }`,
  },
  {
    name: "number and text animation libraries other than torph",
    rule: "eslint(no-restricted-imports)",
    source: `import NumberFlow from "@number-flow/react";
export function Probe({ total }: { total: number }) { return <NumberFlow value={total} />; }`,
  },
  {
    name: "the Next.js adapter for glimm",
    rule: "eslint(no-restricted-imports)",
    source: `import { TransitionLink } from "glimm/next";
export function Probe() { return <TransitionLink href="/">Home</TransitionLink>; }`,
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
  {
    name: "throwing a value that is not an Error",
    rule: "typescript(only-throw-error)",
    source: `export function fail() { throw "Failed to save"; }`,
  },
  {
    name: "catch callbacks that type the error as any",
    rule: "typescript(use-unknown-in-catch-callback-variable)",
    source: `export const failure = Promise.reject(new Error("Failed")).catch((error) => error);`,
  },
  {
    name: "async functions that never await",
    rule: "typescript(require-await)",
    source: `export async function load() { return 1; }`,
  },
  {
    name: "a promise returned from try without await",
    rule: "typescript(return-await)",
    source: `export async function load(fetchItem: () => Promise<number>) {
try { return fetchItem(); } catch { return 0; }
}`,
  },
  {
    name: "browser dialogs",
    rule: "eslint(no-alert)",
    source: `export function notify() { alert("Saved"); }`,
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
    name: "conditionals inside tests",
    rule: "vitest(no-conditional-in-test)",
    source: `import { expect, it } from "vite-plus/test";
it("parses", () => {
const value = Number("1");
if (value > 0) expect(value).toBe(1);
});`,
  },
  {
    name: "duplicate test titles",
    rule: "vitest(no-identical-title)",
    source: `import { expect, it } from "vite-plus/test";
it("parses", () => { expect(Number("1")).toBe(1); });
it("parses", () => { expect(Number("2")).toBe(2); });`,
  },
  {
    name: "src/lib importing a component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "src/hooks importing a component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/hooks",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "the UI kit importing an app component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components/ui",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "importing a route module",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components",
    source: `import { Route } from "@/routes/index";\nexport const route = Route;`,
  },
  {
    name: "a server module in src/lib importing a component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    file: "component-import.server.ts",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "src/lib importing a nested kit component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { Button } from "@/components/ui/button";\nexport const button = Button;`,
  },
  {
    name: "src/config importing a nested app component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/config",
    source: `import { BullSticker } from "@/components/stickers/bull";\nexport const sticker = BullSticker;`,
  },
  {
    name: "src/config importing a nested hook module",
    rule: "eslint(no-restricted-imports)",
    layer: "src/config",
    source: `import { useTheme } from "@/hooks/theme/use-theme";\nexport const theme = useTheme;`,
  },
  {
    name: "src/hooks importing a nested kit component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/hooks",
    source: `import { Button } from "@/components/ui/button";\nexport const button = Button;`,
  },
  {
    name: "the UI kit importing a nested app component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components/ui",
    source: `import { BullSticker } from "@/components/stickers/bull";\nexport const sticker = BullSticker;`,
  },
  {
    name: "a server module in src/lib importing a nested kit component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    file: "nested-component-import.server.ts",
    source: `import { Button } from "@/components/ui/button";\nexport const button = Button;`,
  },
  {
    name: "importing a nested route module",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components",
    source: `import { Route } from "@/routes/(demo)/philosophy";\nexport const route = Route;`,
  },
  {
    name: "nested Node built-in paths in client code",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { readFile } from "node:fs/promises";\nexport const read = readFile;`,
  },
  {
    name: "classic Zod imports in src/lib",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { z } from "zod";
export const schema = z.object({ id: z.string() });`,
  },
  {
    name: "a kit component importing the demo",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components",
    source: `import { Hero } from "@/demo/landing/hero";\nexport const hero = Hero;`,
  },
  {
    name: "src/lib importing the demo",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { reveal } from "@/demo/motion-classes";\nexport const entrance = reveal;`,
  },
  {
    name: "a server module in src/lib importing the demo",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    file: "demo-import.server.ts",
    source: `import { reveal } from "@/demo/motion-classes";\nexport const entrance = reveal;`,
  },
  {
    name: "the relative demo import a file at the src root would write",
    rule: "eslint(no-restricted-imports)",
    layer: "src",
    source: `import { Hero } from "./demo/landing/hero";\nexport const hero = Hero;`,
  },
  {
    name: "a relative import of the whole demo folder",
    rule: "eslint(no-restricted-imports)",
    layer: "src",
    source: `import * as demo from "./demo";\nexport const loaded = demo;`,
  },
  {
    name: "the relative demo routes import a file at the src root would write",
    rule: "eslint(no-restricted-imports)",
    layer: "src",
    source: `import { Route } from "./routes/(demo)/philosophy";\nexport const route = Route;`,
  },
  {
    name: "the relative demo route import a route would write",
    rule: "eslint(no-restricted-imports)",
    layer: "src/routes",
    source: `import { Route } from "./(demo)/philosophy";\nexport const route = Route;`,
  },
  {
    name: "browser tests importing test and expect from @playwright/test",
    rule: "eslint(no-restricted-imports)",
    layer: "e2e",
    file: "base-test.ts",
    source: `import { expect, test } from "@playwright/test";
test("loads the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Rodeo");
});`,
  },
  {
    name: "Node built-ins in client code",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { readFileSync } from "node:fs";\nexport const read = readFileSync;`,
  },
  {
    name: "process.env in client code",
    rule: "eslint(no-restricted-globals)",
    layer: "src/lib",
    source: `export const apiKey = process.env.API_KEY;`,
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
    name: "unit tests in app code",
    rule: "eslint(no-restricted-imports)",
    help: appUnitTestReason,
    layer: "src/lib",
    source: `import { expect, it } from "vite-plus/test";
it("adds", () => { expect(1 + 1).toBe(2); });`,
  },
];

const allowed: Probe[] = [
  {
    name: "explicit behavior and external synchronization with cleanup",
    source: `import { useEffect, useState } from "react";
import * as z from "zod/mini";
import { ProbeButton } from "${kitStandIn}";
export const itemSchema = z.object({ id: z.string(), tab: z.catch(z.enum(["a", "b"]), "a") });
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
    // why: Cache removal is best-effort, and a failure must not block signing out.
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
      <ProbeButton className="mt-m w-full">Save</ProbeButton>
      <p className="text-s font-medium text-success">Ready</p>
    </>
  );
}`,
  },
  {
    name: "dynamic values through CSS custom properties",
    source: `export function Probe({ value, fade }: { value: number; fade: number }) {
  return (
    <div
      className="w-(--progress) opacity-(--fade)"
      style={{ "--progress": \`\${value}%\`, "--fade": fade }}
    />
  );
}`,
  },
  {
    name: "Node code in a server module",
    layer: "src/lib",
    file: "secrets.server.ts",
    source: `import { env } from "node:process";
export const apiKey = env.API_KEY;
export const region = process.env.REGION;`,
  },
  {
    name: "fixed colors in sticker artwork",
    layer: "src/components/stickers",
    source: `export function Probe() { return <svg aria-hidden="true"><path fill="#863bff" d="M0 0h4v4z" /></svg>; }`,
  },
  {
    name: "kit and Icon imports inside the kit",
    layer: "src/components/ui",
    source: `import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { ProbeButton } from "${kitStandIn}";
export const parts = { Copy01Icon, Icon, ProbeButton };`,
  },
  {
    name: "nested kit and app component imports in an app component",
    layer: "src/components",
    source: `import { ProbeBadge } from "${appStandIn}";
import { ProbeButton } from "${kitStandIn}";
export function Probe() {
  return (
    <ProbeButton>
      <ProbeBadge />
      Save
    </ProbeButton>
  );
}`,
  },
  {
    name: "text that morphs in place and skeletons drawn from the real component",
    source: `import { use, useState } from "react";
import { Skeleton, SkeletonBox, SkeletonSuspense } from "skullet/react";
import { TextMorph } from "torph/react";
import { ProbeButton } from "${kitStandIn}";
interface Profile { name: string; bio: string }
const sampleProfile: Profile = { name: "Sample Person", bio: "One line about this person." };
function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="space-y-xs rounded-m bg-card p-m">
      <h2 className="text-l font-heavy">{profile.name}</h2>
      <p className="text-s text-muted-foreground">{profile.bio}</p>
    </article>
  );
}
function StreamedProfile({ profile }: { profile: Promise<Profile> }) {
  return <ProfileCard profile={use(profile)} />;
}
export function Streamed({ profile }: { profile: Promise<Profile> }) {
  return (
    <SkeletonSuspense skeleton={<ProfileCard profile={sampleProfile} />} label="Loading profile">
      <StreamedProfile profile={profile} />
    </SkeletonSuspense>
  );
}
export function Fetched({ profile }: { profile: Profile | null }) {
  return (
    <Skeleton data={profile} sample={sampleProfile} label="Loading profile">
      {(loaded) => <ProfileCard profile={loaded} />}
    </Skeleton>
  );
}
export function ChartPlaceholder() {
  return <SkeletonBox width="100%" height={240} />;
}
export function CopyButton() {
  const [copied, setCopied] = useState(false);
  return (
    <ProbeButton onClick={() => setCopied(true)}>
      <TextMorph>{copied ? "Copied" : "Copy"}</TextMorph>
    </ProbeButton>
  );
}
export function Total({ total }: { total: number }) {
  return (
    <p className="text-xl font-heavy tabular-nums">
      <TextMorph>{\`$\${total.toLocaleString("en")}\`}</TextMorph>
    </p>
  );
}`,
  },
  {
    name: "a sweep on a milestone, across the page and inside one card",
    source: `import { useNavigate } from "@tanstack/react-router";
import { GlimmProvider, GlimmScope, useGlimm, type GlimmScopeHandle } from "glimm/react";
import { useRef, useState, type ReactNode } from "react";
import { ProbeButton } from "${kitStandIn}";
export function CheckoutLayout({ children, theme }: { children: ReactNode; theme: "light" | "dark" }) {
  return (
    <GlimmProvider palette="prism" brightness={theme === "dark" ? 0.85 : 1}>
      {children}
    </GlimmProvider>
  );
}
export function PublishButton() {
  const navigate = useNavigate();
  const { sweep } = useGlimm();
  return (
    <ProbeButton onClick={() => sweep(() => navigate({ to: "/", viewTransition: false }))}>
      Publish
    </ProbeButton>
  );
}
export function PlanCard() {
  const scope = useRef<GlimmScopeHandle>(null);
  const [plan, setPlan] = useState("Free");
  return (
    <div className="h-[200px] *:h-full">
      <GlimmScope ref={scope} curve={0.06} bandTight={34}>
        <article className="h-full rounded-m bg-card p-m">
          <p className="text-l font-heavy">{plan}</p>
          <ProbeButton onClick={() => scope.current?.play({ change: () => setPlan("Pro") })}>
            Upgrade
          </ProbeButton>
        </article>
      </GlimmScope>
    </div>
  );
}`,
  },
];

// why: Path-scoped overrides match from the repository root, so a probe for src/lib must sit in
// src/lib. TypeScript's include globs skip its dot directory, and .gitignore lists it.
function probeHome({ layer }: Pick<Probe, "layer">) {
  return layer === undefined
    ? { parent: join(repoRoot, scratchDirectory), prefix: sandboxPrefix }
    : { parent: join(repoRoot, layer), prefix: layerPrefix };
}

function probeDirectory(probe: Pick<Probe, "layer">) {
  const { parent, prefix } = probeHome(probe);
  return join(parent, `${prefix}${process.pid}`);
}

function probePath(probe: Probe) {
  return join(
    probeDirectory(probe),
    probe.file ?? `${probe.name.replaceAll(/[^a-z0-9]+/gi, "-")}.tsx`,
  );
}

const allowedFiles = [
  {
    name: "the e2e fixtures module extending the base test from @playwright/test",
    path: join(repoRoot, "e2e", "fixtures.ts"),
  },
];

const probes = [...rejected, ...allowed];
const written = [...probes, ...standIns];
const probeDirectories = [...new Set(written.map((probe) => probeDirectory(probe)))];

function isRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error instanceof Error && "code" in error && error.code === "EPERM";
  }
}

function leftoverRun(name: string, prefix: string) {
  const pid = name.slice(prefix.length);
  return name.startsWith(prefix) && /^\d+$/.test(pid) && !isRunning(Number(pid));
}

function leftoverProbeDirectories() {
  const homes = new Map(
    written.map((probe) => {
      const { parent, prefix } = probeHome(probe);
      return [parent, prefix] as const;
    }),
  );
  return [...homes].flatMap(([parent, prefix]) =>
    (existsSync(parent) ? readdirSync(parent) : [])
      .filter((name) => leftoverRun(name, prefix))
      .map((name) => join(parent, name)),
  );
}

let diagnostics: ReturnType<typeof diagnosticsByFile> = new Map();

function codesFor(path: string) {
  return (diagnostics.get(path) ?? []).map(({ code }) => code);
}

function helpFor(path: string) {
  return (diagnostics.get(path) ?? []).flatMap(({ help }) => (help === undefined ? [] : [help]));
}

const explained = rejected.flatMap(({ help, ...probe }) =>
  help === undefined ? [] : [{ ...probe, help }],
);

const sandboxes = withSandbox();

// why: One type-aware lint run over every probe takes several seconds, longer than the default
// hook timeout while CI builds in parallel.
beforeAll(async () => {
  for (const directory of leftoverProbeDirectories())
    rmSync(directory, { recursive: true, force: true });
  for (const directory of probeDirectories) {
    sandboxes.directory(directory);
    writeFileSync(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        extends: join(repoRoot, "tsconfig.app.json"),
        include: ["*.ts", "*.tsx", appDeclarations],
      }),
    );
  }
  for (const probe of written) {
    writeFileSync(probePath(probe), probe.source);
    for (const [file, source] of Object.entries(probe.extraFiles ?? {})) {
      writeFileSync(join(probeDirectory(probe), file), source);
    }
  }
  const output = await runJson(
    vp,
    [
      "lint",
      "--no-ignore",
      "--format",
      "json",
      ...probes.map((probe) => probePath(probe)),
      ...allowedFiles.map(({ path }) => path),
    ],
    repoRoot,
  );
  diagnostics = diagnosticsByFile(output, repoRoot);
}, 60_000);

describe("Lint policy", () => {
  it.for(rejected)("rejects $name", (probe, { expect }) => {
    expect(codesFor(probePath(probe))).toEqual(
      expect.arrayContaining([expect.stringContaining(probe.rule)]),
    );
  });

  it.for(explained)("gives the project's reason when it rejects $name", (probe, { expect }) => {
    expect(helpFor(probePath(probe))).toEqual([probe.help]);
  });

  it.for(allowed)("allows $name", (probe, { expect }) => {
    expect(codesFor(probePath(probe))).toEqual([]);
  });

  it.for(allowedFiles)("allows the repository file $name", ({ path }, { expect }) => {
    expect(codesFor(path)).toEqual([]);
  });

  it("writes its probes only where Git ignores them", async ({ expect }) => {
    const paths = written.map((probe) => relative(repoRoot, probePath(probe)));
    expect(await ignoredByGit(paths)).toEqual(paths);
  });
});
