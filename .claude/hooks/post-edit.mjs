import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const fallbackRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const projectRoot = realpathSync(process.env.CLAUDE_PROJECT_DIR ?? fallbackRoot);
const supportedExtensions = new Set([
  ".css",
  ".cts",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const typeScriptExtensions = new Set([".cts", ".mts", ".ts", ".tsx"]);
const ignoredRoots = [
  ".git",
  ".output",
  ".tanstack",
  ".tanstack-start",
  "coverage",
  "node_modules",
];

function packageBinary(packageName, binaryName) {
  const packagePath = require.resolve(`${packageName}/package.json`);
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const binary =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[binaryName];
  if (!binary) throw new Error(`${packageName} does not expose ${binaryName}`);
  return resolve(dirname(packagePath), binary);
}

function run(binary, args) {
  return spawnSync(process.execPath, [binary, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env,
  });
}

function report(message) {
  const additionalContext = message.length > 4_000 ? `${message.slice(0, 3_997)}...` : message;
  process.stdout.write(
    `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext } })}\n`,
  );
}

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (
    input.hook_event_name !== "PostToolUse" ||
    !["Edit", "Write"].includes(input.tool_name) ||
    typeof input.tool_input?.file_path !== "string"
  ) {
    process.exit(0);
  }

  const candidate = isAbsolute(input.tool_input.file_path)
    ? input.tool_input.file_path
    : resolve(projectRoot, input.tool_input.file_path);
  if (!existsSync(candidate) || !lstatSync(candidate).isFile()) process.exit(0);

  const target = realpathSync(candidate);
  const projectPath = relative(projectRoot, target);
  if (
    projectPath === "" ||
    projectPath.startsWith("..") ||
    isAbsolute(projectPath) ||
    ignoredRoots.some((root) => projectPath === root || projectPath.startsWith(`${root}/`))
  ) {
    process.exit(0);
  }

  const extension = extname(target).toLowerCase();
  if (!supportedExtensions.has(extension)) process.exit(0);

  const format = run(packageBinary("vite-plus", "vp"), ["fmt", target]);
  if (format.status !== 0) {
    report(`Automatic formatting failed for ${projectPath}.\n${format.stderr || format.stdout}`);
    process.exit(0);
  }

  if (typeScriptExtensions.has(extension)) {
    const typecheck = run(packageBinary("typescript", "tsc"), ["-b", "--pretty", "false"]);
    if (typecheck.status !== 0) {
      report(
        `Type checking found an issue after editing ${projectPath}.\n${typecheck.stdout || typecheck.stderr}`,
      );
    }
  }
} catch (error) {
  report(
    `Post-edit feedback could not run.\n${error instanceof Error ? error.message : String(error)}`,
  );
}
