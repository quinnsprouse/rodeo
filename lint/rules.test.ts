import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { rodeoRuleNames, type RodeoRuleName } from "./rodeo-rules";

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginPath = join(repoRoot, "lint", "rules.js");
// why: oxlint is a dependency of vite-plus, not of this project, so it resolves from there instead
// of relying on npm hoisting a transitive package.
const requireFromVitePlus = createRequire(require.resolve("vite-plus/package.json"));
const oxlintBinary = resolve(
  dirname(requireFromVitePlus.resolve("oxlint/package.json")),
  "bin/oxlint",
);

function isRuleName(value: string): value is RodeoRuleName {
  return (rodeoRuleNames as readonly string[]).includes(value);
}

type Diagnostic = { rule: RodeoRuleName; line: number; message: string };
type Probe = { file: string; source: string };

const probes: Probe[] = [];

function probe(source: string, file = "src/probe.tsx"): Probe {
  const unique = file.replace(/(\.[^/]+)$/, `-${probes.length}$1`);
  const registered = { file: normalize(unique), source };
  probes.push(registered);
  return registered;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

let sandbox: string;
let diagnosticsByFile = new Map<string, Diagnostic[]>();

function parseDiagnostic(entry: unknown): [string, Diagnostic] {
  if (
    !isRecord(entry) ||
    typeof entry.code !== "string" ||
    typeof entry.message !== "string" ||
    typeof entry.filename !== "string"
  ) {
    throw new Error(`Unexpected diagnostic: ${JSON.stringify(entry)}`);
  }
  const rule = entry.code.replace(/^rodeo\((.+)\)$/, "$1");
  if (!isRuleName(rule)) throw new Error(`Unexpected rule id: ${entry.code}`);
  const label: unknown = Array.isArray(entry.labels) ? entry.labels[0] : undefined;
  const span = isRecord(label) && isRecord(label.span) ? label.span : undefined;
  const file = relative(sandbox, realpathSync(resolve(sandbox, entry.filename)));
  const line = typeof span?.line === "number" ? span.line : 0;
  return [file, { rule, line, message: entry.message }];
}

function parseRun(json: string) {
  const parsed: unknown = JSON.parse(json);
  if (!isRecord(parsed) || !Array.isArray(parsed.diagnostics)) {
    throw new Error(`Unexpected oxlint output: ${json}`);
  }
  if (parsed.number_of_files !== probes.length) {
    throw new Error(`Oxlint linted ${String(parsed.number_of_files)} of ${probes.length} probes`);
  }
  const byFile = new Map(probes.map((registered) => [registered.file, Array<Diagnostic>()]));
  for (const entry of parsed.diagnostics) {
    const [file, diagnostic] = parseDiagnostic(entry);
    const hits = byFile.get(file);
    if (hits === undefined) throw new Error(`Diagnostic for a file that is not a probe: ${file}`);
    hits.push(diagnostic);
  }
  return byFile;
}

// why: One oxlint run lints every probe, and its startup can exceed the default hook timeout
// while CI builds in parallel.
beforeAll(() => {
  sandbox = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-lint-rules-")));
  symlinkSync(join(repoRoot, "node_modules"), join(sandbox, "node_modules"), "dir");
  writeFileSync(
    join(sandbox, ".oxlintrc.json"),
    JSON.stringify({
      jsPlugins: [{ name: "rodeo", specifier: pluginPath }],
      categories: { correctness: "off" },
      rules: Object.fromEntries(rodeoRuleNames.map((name) => [`rodeo/${name}`, "error"])),
    }),
  );
  for (const { file, source } of probes) {
    mkdirSync(dirname(join(sandbox, file)), { recursive: true });
    writeFileSync(join(sandbox, file), source);
  }
  // why: Oxlint's config discovery is not reliable from inside a Vitest worker.
  const result = spawnSync(
    process.execPath,
    [oxlintBinary, "-c", ".oxlintrc.json", "--format", "json", ...probes.map(({ file }) => file)],
    { cwd: sandbox, encoding: "utf8" },
  );
  diagnosticsByFile = parseRun(result.stdout);
}, 30_000);

afterAll(() => {
  rmSync(sandbox, { force: true, recursive: true });
});

function lint(target: Probe): Diagnostic[] {
  return diagnosticsByFile.get(target.file) ?? [];
}

function rulesHit(target: Probe) {
  return lint(target).map((hit) => hit.rule);
}

describe("no-disable-directives", () => {
  const directives = probe(`/* oxlint-disable */
// oxlint-disable-next-line no-restricted-imports
const a = 1;
/* eslint-disable */
const b = 2; // oxlint-disable-line
export { a, b };`);
  it("reports every directive at the top of the file so no directive can hide itself", () => {
    const hits = lint(directives);
    expect(hits.map((hit) => hit.line)).toEqual([1, 1, 1, 1]);
    expect(hits.map((hit) => hit.message)).toEqual([
      expect.stringContaining("Line 1 has an inline lint suppression (oxlint-disable)"),
      expect.stringContaining("Line 2 has an inline lint suppression (oxlint-disable-next-line)"),
      expect.stringContaining("Line 4 has an inline lint suppression (eslint-disable)"),
      expect.stringContaining("Line 5 has an inline lint suppression (oxlint-disable-line)"),
    ]);
  });

  const lintMention = probe(
    `// why: Disabled features are listed in the docs.\nexport const a = 1;`,
    "scripts/probe.ts",
  );
  it("ignores ordinary comments that mention linting", () => {
    expect(rulesHit(lintMention)).toEqual([]);
  });
});

describe("server-fn-requires-validator", () => {
  const unvalidated = probe(`
import { createServerFn } from "@tanstack/react-start";
export const a = createServerFn({ method: "POST" }).handler(({ data }) => data);
export const b = createServerFn().handler((ctx) => ctx.data);`);
  it("reports handlers that read data without a validator", () => {
    expect(rulesHit(unvalidated)).toEqual([
      "server-fn-requires-validator",
      "server-fn-requires-validator",
    ]);
  });

  const validated = probe(`
import { createServerFn } from "@tanstack/react-start";
export const a = createServerFn({ method: "POST" }).validator((d: unknown) => d).handler(({ data }) => data);
export const b = createServerFn({ method: "POST" }).inputValidator((d: unknown) => d).handler(({ data }) => data);
export const c = createServerFn({ method: "GET" }).handler(() => "ok");
export const d = createServerFn({ method: "GET" }).handler(({ context }) => context);`);
  it("allows validated handlers and handlers that ignore input", () => {
    expect(rulesHit(validated)).toEqual([]);
  });
});

describe("no-state-from-props", () => {
  const seededFromProps = probe(`
import { useState } from "react";
export function A({ value }: { value: number }) { const [v] = useState(value); return v; }
export function B(props: { count: number }) { const [c] = useState(props.count); return c; }`);
  it("reports state seeded from a destructured or dotted prop", () => {
    expect(rulesHit(seededFromProps)).toEqual(["no-state-from-props", "no-state-from-props"]);
  });

  const seededFromDefaults = probe(`
import { useState } from "react";
export function A({ defaultValue, initialCount }: { defaultValue: number; initialCount: number }) {
  const [v] = useState(defaultValue);
  const [c] = useState(initialCount);
  const [n] = useState(0);
  return v + c + n;
}`);
  it("allows default*/initial* props and unrelated initializers", () => {
    expect(rulesHit(seededFromDefaults)).toEqual([]);
  });
});

describe("no-module-scope-browser-globals", () => {
  const moduleScopeReads = probe(`
const saved = localStorage.getItem("x");
const width = window.innerWidth;
const ua = navigator.userAgent;
export { saved, width, ua };`);
  it("reports browser globals read at module scope", () => {
    expect(rulesHit(moduleScopeReads)).toEqual([
      "no-module-scope-browser-globals",
      "no-module-scope-browser-globals",
      "no-module-scope-browser-globals",
    ]);
  });

  const guardedReads = probe(`
const isBrowser = typeof window !== "undefined";
export function read() { return localStorage.getItem("x"); }
export const handler = () => document.title;
export function shadow(document: string) { return document; }
export const config = { window: 1, location: "/" };
export { isBrowser };`);
  it("allows typeof guards, function bodies, and shadowed names", () => {
    expect(rulesHit(guardedReads)).toEqual([]);
  });
});

describe("no-window-navigation", () => {
  const hardNavigations = probe(`
export function go() {
  window.location.href = "/a";
  location.href = "/b";
  window.location = "/c" as unknown as Location;
  window.location.assign("/d");
  location.replace("/e");
}`);
  it("reports hard navigations", () => {
    expect(rulesHit(hardNavigations)).toEqual(Array<RodeoRuleName>(5).fill("no-window-navigation"));
  });

  const locationRead = probe(`export const path = () => window.location.pathname;`);
  it("allows reading location", () => {
    expect(rulesHit(locationRead)).toEqual([]);
  });
});

function pluginRuleNames(pluginModule: unknown) {
  if (!isRecord(pluginModule) || !isRecord(pluginModule.default)) {
    throw new Error("lint/rules.js has no default export");
  }
  const { rules } = pluginModule.default;
  if (!isRecord(rules)) throw new Error("lint/rules.js exports no rules");
  return Object.keys(rules);
}

describe("registration", () => {
  it("registers every rule the plugin defines with Oxlint and React Doctor", async () => {
    const pluginModule: unknown = await import(pluginPath);

    expect(pluginRuleNames(pluginModule).toSorted()).toEqual(rodeoRuleNames.toSorted());
  });
});

describe("no-comments", () => {
  const commentGroups = probe(`// Section label
// that continues on the next line
export const a = 1; /* trailing note */
/** Describes the component. */
export function Probe() { return <div>{/* Hero */}</div>; }`);
  it("reports line, block, and JSX comments once per group", () => {
    const hits = lint(commentGroups);

    expect(hits.map((hit) => [hit.rule, hit.line])).toEqual([
      ["no-comments", 1],
      ["no-comments", 3],
      ["no-comments", 4],
      ["no-comments", 5],
    ]);
  });

  const shortToolingReason = probe(`// why: hack\nexport const a = 1;`, "scripts/probe.ts");
  it("requires a reason of at least three words after why: in tooling", () => {
    const hits = lint(shortToolingReason);

    expect(hits.map((hit) => hit.message)).toEqual([expect.stringContaining("at least 3 words")]);
  });

  const toolingReasons = probe(
    `// why: Safari drops the first frame
// when the element starts hidden.
export const a = 1;
/* why: The spec requires a trailing slash here. */
export function Probe() { return <div>{/* why: Screen readers skip this decoration. */}</div>; }`,
    "scripts/probe.tsx",
  );
  it("allows why: comments in tooling across continued lines, blocks, and JSX", () => {
    expect(rulesHit(toolingReasons)).toEqual([]);
  });

  const unnamedCauses = probe(`// why: The layout breaks when this value changes later.
export const a = 1;
// why: The worker isolates scenarios in random order, so one crash stays contained.
export const b = 2;`);
  it("requires app code why: comments to name a known cause, matching short names as whole words", () => {
    const hits = lint(unnamedCauses);
    const missingCause = /names no cause.+add the name to KNOWN_CAUSES in lint\/rules\.js/;

    expect(hits.map((hit) => hit.line)).toEqual([1, 3]);
    expect(hits.map((hit) => hit.message)).toEqual([
      expect.stringMatching(missingCause),
      expect.stringMatching(missingCause),
    ]);
  });

  const backendCauses =
    probe(`// why: Postgres returns bigint columns as strings, so the total is parsed before the sum.
export const a = 1;
// why: Daylight saving time skips an hour, so the schedule compares instants and not clock times.
export const b = 2;
// why: ISO 8601 strings without an offset parse as local time, so this appends a Z.
export const c = 3;
// why: JWTs are signed, not encrypted, so the payload never holds a secret.
export const d = 4;`);
  it("accepts backend, data, and time causes in app code", () => {
    expect(rulesHit(backendCauses)).toEqual([]);
  });

  const tooShortAppReason = probe(`// why: Safari needs this.\nexport const a = 1;`);
  const tooLongAppReason = probe(
    `// why: ${Array.from({ length: 31 }, () => "Safari").join(" ")}\nexport const a = 1;`,
    "e2e/probe.spec.ts",
  );
  it("keeps app code why: comments between 6 and 30 words", () => {
    const hits = [...lint(tooShortAppReason), ...lint(tooLongAppReason)];

    expect(hits.map((hit) => hit.message)).toEqual([
      expect.stringContaining("6 to 30 words"),
      expect.stringContaining("6 to 30 words"),
    ]);
  });

  const continuedAppReason = probe(`// why: Safari drops the first frame
// when the element starts hidden.
export const a = 1;`);
  const e2eAppReason = probe(
    `// why: Playwright's toBeVisible ignores opacity, so this reads visibility directly.\nexport const a = 1;`,
    "e2e/probe.spec.ts",
  );
  const dependencyAppReason = probe(
    `// why: TanStack Router reads this export by name, so renaming it breaks the route.\nexport const a = 1;`,
  );
  it("accepts short app code why: comments that name their cause", () => {
    expect([
      ...rulesHit(continuedAppReason),
      ...rulesHit(e2eAppReason),
      ...rulesHit(dependencyAppReason),
    ]).toEqual([]);
  });

  const otherDirectives = probe(`// @ts-expect-error The fixture is intentionally untyped.
export const a: number = "x";
// oxlint-disable-next-line no-console
console.log(a);`);
  it("leaves TypeScript directives and lint directives to their own rules", () => {
    expect(rulesHit(otherDirectives)).toEqual(["no-disable-directives"]);
  });
});

describe("no-import-meta-env", () => {
  const envReads = probe(`export const a = import.meta.env.VITE_APP_URL;
export const b = import.meta.env["VITE_KEY"];
export const { VITE_X } = import.meta.env;
export const c = import.meta["env"].VITE_KEY;
const { env } = import.meta;
export const d = env;`);
  it("reports VITE_* reads and whole-object reads", () => {
    expect(rulesHit(envReads)).toEqual(Array<RodeoRuleName>(5).fill("no-import-meta-env"));
  });

  const builtInFlags = probe(`export const moduleUrl = import.meta.url;
export const flags = [
  import.meta.env.DEV,
  import.meta.env.PROD,
  import.meta.env.SSR,
  import.meta.env.MODE,
  import.meta.env.BASE_URL,
];`);
  it("allows Vite's built-in flags", () => {
    expect(rulesHit(builtInFlags)).toEqual([]);
  });
});
