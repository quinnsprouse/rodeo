import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll } from "vite-plus/test";

import { hermeticGitEnv } from "#tooling/git-env";
import { run } from "#tooling/run";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function isRecord(value: unknown): value is Record<string, unknown> {
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
