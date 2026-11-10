import { spawn } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

function resolveProjectRoot() {
  const root =
    process.env.CLAUDE_PROJECT_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  return existsSync(root) ? realpathSync(root) : root;
}

export const projectRoot = resolveProjectRoot();

const requireFromProject = createRequire(join(projectRoot, "package.json"));

export function dependenciesInstalled() {
  return existsSync(join(projectRoot, "node_modules", "vite-plus"));
}

export function gitHooksInstalled() {
  return existsSync(join(projectRoot, ".vite-hooks", "_", "h"));
}

export function packageBinary(packageName, binaryName) {
  const packagePath = requireFromProject.resolve(`${packageName}/package.json`);
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const binary =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[binaryName];
  if (!binary) throw new Error(`${packageName} does not expose ${binaryName}`);
  return resolve(dirname(packagePath), binary);
}

export function clean(text) {
  return stripVTControlCharacters(text)
    .split("\n")
    .filter((line) => !line.startsWith("note: You are running `vp"))
    .join("\n")
    .replace(/^(?:[ \t]*\n)+/, "")
    .trimEnd();
}

export function runTool(binary, args, env = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [binary, ...args], {
      cwd: projectRoot,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", ...env },
    });
    let output = "";
    const collect = (chunk) => {
      output += chunk;
    };
    child.stdout.setEncoding("utf8").on("data", collect);
    child.stderr.setEncoding("utf8").on("data", collect);
    child.on("error", (error) => resolvePromise({ ok: false, output: String(error) }));
    child.on("close", (code) => resolvePromise({ ok: code === 0, output: clean(output) }));
  });
}
