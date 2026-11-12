import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";

import { gitHooksDirectory } from "#tooling/project";
import { isRouteFile, routeTreeIsCurrent } from "#tooling/route-tree";
import { run } from "#tooling/run";

const routeTreeGenerator = join("scripts", "generate-route-tree.mjs");

export function dependenciesInstalled(root) {
  return existsSync(join(root, "node_modules", "vite-plus"));
}

export async function gitHooksInstalled(root) {
  const { stdout } = await run("git", ["config", "--get", "core.hooksPath"], { cwd: root });
  const configured = stdout.trim();
  // why: Git worktrees share core.hooksPath, but the directory it names is generated per checkout,
  // and Git runs no hooks when that directory is missing.
  return configured === `${gitHooksDirectory}/_` && existsSync(join(root, configured));
}

export function packageBinary(root, packageName, binaryName) {
  const packagePath = createRequire(join(root, "package.json")).resolve(
    `${packageName}/package.json`,
  );
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const binary =
    typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[binaryName];
  if (!binary) throw new Error(`${packageName} does not expose ${binaryName}`);
  return resolve(dirname(packagePath), binary);
}

function clean(text) {
  return stripVTControlCharacters(text)
    .split("\n")
    .filter((line) => !line.startsWith("note: You are running `vp"))
    .join("\n")
    .replace(/^(?:[ \t]*\n)+/, "")
    .trimEnd();
}

export async function runTool(root, binary, args, env = {}) {
  try {
    const { status, output } = await run(process.execPath, [binary, ...args], {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", ...env },
    });
    return { ok: status === 0, output: clean(output) };
  } catch (error) {
    return { ok: false, output: String(error) };
  }
}

export async function refreshRouteTree(root, changedPaths) {
  if (!changedPaths.some(isRouteFile) || routeTreeIsCurrent(root)) {
    return { ran: false, ok: true, output: "" };
  }
  return { ran: true, ...(await runTool(root, join(root, routeTreeGenerator), [])) };
}
