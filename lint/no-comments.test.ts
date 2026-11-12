import { describe, expect, it } from "vite-plus/test";

import { ruleProbes } from "./harness";

const { lint, probe, rulesHit } = ruleProbes();

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

  const missingCause =
    /names no cause.+add the name to the matching group in KNOWN_CAUSES in lint\/rules\.js/;

  const unnamedCauses = probe(`// why: The layout breaks when this value changes later.
export const a = 1;
// why: The worker isolates scenarios in random order, so one crash stays contained.
export const b = 2;`);
  it("requires app code why: comments to name a known cause, matching names as whole words", () => {
    const hits = lint(unnamedCauses);

    expect(hits.map((hit) => hit.line)).toEqual([1, 3]);
    expect(hits.map((hit) => hit.message)).toEqual([
      expect.stringMatching(missingCause),
      expect.stringMatching(missingCause),
    ]);
  });

  const lookalikeCauses = Object.entries({
    latest: "The latest release renamed this option, so the old key stays mapped.",
    database: "The database stores amounts in cents, so the total divides by one hundred.",
    codebase: "The codebase loads this module twice, so the setup must stay idempotent.",
    specific: "Each specific locale needs its own message table, so the lookup falls back.",
    special: "Special characters break the slug, so the title is normalized before saving.",
    test: "The test fails when this runs first, so the order stays fixed.",
    base: "The base value comes from the theme, so the offset adds to it.",
    class: "The class name must stay stable, so the selector keeps matching it.",
    types: "The types drift when this changes, so the schema stays the source.",
    Slack: "Slack truncates long messages, so the summary stays under the limit.",
  }).map(([word, reason]) => ({ word, target: probe(`// why: ${reason}\nexport const a = 1;`) }));
  it.each(lookalikeCauses)(
    "rejects a why: comment whose only cause candidate is $word",
    ({ target }) => {
      expect(lint(target).map((hit) => hit.message)).toEqual([expect.stringMatching(missingCause)]);
    },
  );

  const namedCauses = Object.entries({
    React: "React runs effects twice in development, so the subscription cleans up.",
    "Vite+": "Vite+ runs this file before the app loads, so it stays pure.",
    "Safari's": "Safari's date picker ignores the min attribute, so the value is clamped here.",
    HTML5: "HTML5 drag events fire without coordinates, so the position comes from the pointer.",
    "Node.js": "Node.js buffers the whole body, so large uploads stream to disk instead.",
    Tailwind: "Tailwind scans source files for literal names, so this list spells each one out.",
    "Base UI": "Base UI moves focus to the popup, so the trigger restores it on close.",
    Stripe: "Stripe retries a webhook for three days, so the handler must be idempotent.",
  }).map(([cause, reason]) => ({ cause, target: probe(`// why: ${reason}\nexport const a = 1;`) }));
  it.each(namedCauses)("accepts $cause as the cause of an app code why: comment", ({ target }) => {
    expect(rulesHit(target)).toEqual([]);
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
