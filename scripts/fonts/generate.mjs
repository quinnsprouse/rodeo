import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { fontOutputs } from "#tooling/project";
import { startBuiltServer } from "#tooling/server";

import { auditFonts } from "./audit.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));

function runStep(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runStep(process.execPath, ["scripts/run-verification.mjs", "--ignore-depends-on", "verify:build"]);

const server = await startBuiltServer({ root });
try {
  await auditFonts({ root, origin: server.origin, usageFile: fontOutputs.usage });
} finally {
  await server.stop();
}
runStep("vp", ["fmt", fontOutputs.usage]);

runStep("uv", [
  "run",
  "--script",
  "scripts/fonts/subset.py",
  "--usage",
  fontOutputs.usage,
  "--fonts",
  fontOutputs.fonts,
  "--stylesheet",
  fontOutputs.stylesheet,
  ...process.argv.slice(2),
]);
runStep("vp", ["fmt", fontOutputs.stylesheet]);
