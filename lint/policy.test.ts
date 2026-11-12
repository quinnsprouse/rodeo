import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

import { beforeAll, describe, it } from "vite-plus/test";

import { scratchDirectory } from "#tooling/project";

import { diagnosticsByFile, ignoredByGit, repoRoot, runJson, withSandbox } from "./harness";
import { codeShapeProbes } from "./policy/code-shape";
import { correctnessProbes } from "./policy/correctness";
import { layerProbes } from "./policy/layers";
import { libraryProbes } from "./policy/libraries";
import { layerPrefix, standIns, type PolicyTopic, type Probe } from "./policy/probe";
import { reactProbes } from "./policy/react";
import { stylingProbes } from "./policy/styling";
import { testProbes } from "./policy/tests";

const require = createRequire(import.meta.url);
const vp = join(dirname(require.resolve("vite-plus/package.json")), "bin/vp");
const sandboxPrefix = "lint-policy-";
const appDeclarations = join(repoRoot, "src", "types", "*.d.ts");

const topics: PolicyTopic[] = [
  correctnessProbes,
  reactProbes,
  stylingProbes,
  libraryProbes,
  layerProbes,
  codeShapeProbes,
  testProbes,
];
const rejected = topics.flatMap((topic) => topic.rejected);
const allowed = topics.flatMap((topic) => topic.allowed ?? []);

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
