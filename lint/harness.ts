import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll } from "vite-plus/test";

import { hermeticGitEnv } from "#tooling/git-env";
import { run } from "#tooling/run";

import {
  commentScopes,
  isRodeoRuleName,
  pluginName,
  rodeoPlugin,
  rodeoRules,
  type RodeoRuleName,
} from "./rodeo-rules";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function runJson(binary: string, args: readonly string[], cwd: string) {
  const { status, stdout, stderr } = await run(process.execPath, [binary, ...args], { cwd });
  try {
    const parsed: unknown = JSON.parse(stdout);
    return parsed;
  } catch (error) {
    throw new Error(
      `${binary} exited ${String(status)} without JSON on stdout:\n${stderr || stdout}`,
      { cause: error },
    );
  }
}

interface Diagnostic {
  code: string;
  message: string;
  help: string | undefined;
  line: number;
}

function parseDiagnostic(entry: unknown, root: string): [string, Diagnostic] {
  if (
    !isRecord(entry) ||
    typeof entry.filename !== "string" ||
    typeof entry.code !== "string" ||
    typeof entry.message !== "string" ||
    !(entry.help === undefined || typeof entry.help === "string")
  ) {
    throw new Error(`Unexpected diagnostic: ${JSON.stringify(entry)}`);
  }
  const label: unknown = Array.isArray(entry.labels) ? entry.labels[0] : undefined;
  const span = isRecord(label) && isRecord(label.span) ? label.span : undefined;
  const line = typeof span?.line === "number" ? span.line : 0;
  const { code, message, help } = entry;
  return [resolve(root, entry.filename), { code, message, help, line }];
}

export function diagnosticsByFile(output: unknown, root: string) {
  if (!isRecord(output) || !Array.isArray(output.diagnostics)) {
    throw new Error(`Unexpected lint output: ${JSON.stringify(output).slice(0, 500)}`);
  }
  const entries: unknown[] = output.diagnostics;
  const byFile = new Map<string, Diagnostic[]>();
  for (const entry of entries) {
    const [file, diagnostic] = parseDiagnostic(entry, root);
    byFile.set(file, [...(byFile.get(file) ?? []), diagnostic]);
  }
  return byFile;
}

export function withSandbox() {
  const created: string[] = [];
  afterAll(() => {
    for (const path of created) rmSync(path, { recursive: true, force: true });
  });
  return {
    temporary(prefix: string) {
      const path = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
      created.push(path);
      return path;
    },
    directory(path: string) {
      created.push(path);
      mkdirSync(path, { recursive: true });
      return path;
    },
  };
}

export async function ignoredByGit(paths: readonly string[]) {
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-gitignore-")));
  const env = hermeticGitEnv();
  try {
    copyFileSync(join(repoRoot, ".gitignore"), join(scratch, ".gitignore"));
    await run("git", ["init", "--quiet"], { cwd: scratch, env });
    const { status, stdout, stderr } = await run("git", ["check-ignore", "--no-index", "--stdin"], {
      cwd: scratch,
      env,
      input: paths.join("\n"),
    });
    if (status !== 0 && status !== 1) throw new Error(`git check-ignore failed: ${stderr}`);
    return stdout.split("\n").filter((path) => path !== "");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// why: oxlint is a dependency of vite-plus, not of this project, so it resolves from there instead
// of relying on npm hoisting a transitive package.
const requireFromVitePlus = createRequire(
  createRequire(import.meta.url).resolve("vite-plus/package.json"),
);
const oxlintBinary = resolve(
  dirname(requireFromVitePlus.resolve("oxlint/package.json")),
  "bin/oxlint",
);

type RuleHit = { rule: RodeoRuleName; line: number; message: string };
type RuleProbe = { file: string; source: string };

function rodeoRule(code: string) {
  const rule = code.replace(new RegExp(String.raw`^${pluginName}\((.+)\)$`), "$1");
  if (!isRodeoRuleName(rule)) throw new Error(`Unexpected rule id: ${code}`);
  return rule;
}

export function ruleProbes() {
  const probes: RuleProbe[] = [];
  const sandboxes = withSandbox();
  let sandbox = "";
  let diagnostics = new Map<string, RuleHit[]>();

  function probesHit(output: unknown) {
    const linted = isRecord(output) ? output.number_of_files : undefined;
    if (linted !== probes.length) {
      throw new Error(`Oxlint linted ${String(linted)} of ${probes.length} probes`);
    }
    const byFile = new Map(probes.map((registered) => [registered.file, Array<RuleHit>()]));
    for (const [path, found] of diagnosticsByFile(output, sandbox)) {
      const hits = byFile.get(relative(sandbox, path));
      if (hits === undefined) throw new Error(`Diagnostic for a file that is not a probe: ${path}`);
      hits.push(
        ...found.map(({ code, line, message }) => ({ rule: rodeoRule(code), line, message })),
      );
    }
    return byFile;
  }

  // why: One oxlint run lints every probe in a test file, and its startup can exceed the default
  // hook timeout while CI builds in parallel.
  beforeAll(async () => {
    sandbox = sandboxes.temporary("rodeo-lint-rules-");
    symlinkSync(join(repoRoot, "node_modules"), join(sandbox, "node_modules"), "dir");
    writeFileSync(
      join(sandbox, ".oxlintrc.json"),
      JSON.stringify({
        jsPlugins: [{ ...rodeoPlugin, specifier: join(repoRoot, rodeoPlugin.specifier) }],
        categories: { correctness: "off" },
        rules: { ...rodeoRules, ...commentScopes.rules },
        overrides: commentScopes.overrides,
      }),
    );
    for (const { file, source } of probes) {
      mkdirSync(dirname(join(sandbox, file)), { recursive: true });
      writeFileSync(join(sandbox, file), source);
    }
    // why: Oxlint's config discovery is not reliable from inside a Vitest worker.
    const output = await runJson(
      oxlintBinary,
      ["-c", ".oxlintrc.json", "--format", "json", ...probes.map(({ file }) => file)],
      sandbox,
    );
    diagnostics = probesHit(output);
  }, 30_000);

  const lint = (target: RuleProbe): RuleHit[] => diagnostics.get(target.file) ?? [];

  return {
    lint,
    rulesHit: (target: RuleProbe) => lint(target).map((hit) => hit.rule),
    probe: (source: string, file = "src/probe.tsx"): RuleProbe => {
      const unique = file.replace(/(\.[^/]+)$/, `-${probes.length}$1`);
      const registered = { file: normalize(unique), source };
      probes.push(registered);
      return registered;
    },
  };
}
