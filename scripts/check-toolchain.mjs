import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const { version: vitePlusVersion } = require("vite-plus/package.json");
const { versions } = require("vite-plus/versions");
const vitestPin = packageJson.overrides.vitest;

assert.equal(packageJson.devDependencies["vite-plus"], vitePlusVersion);
assert.equal(packageJson.overrides.vite, `npm:@voidzero-dev/vite-plus-core@${vitePlusVersion}`);
assert.ok(
  vitestPin === undefined || vitestPin === versions.vitest,
  `The vitest override must pin the Vitest that Vite+ bundles, ${versions.vitest}. Run vp migrate to re-pin or remove it.`,
);
assert.equal(
  packageJson.devDependencies["@oxlint/plugins"],
  undefined,
  "Import the lint plugin API from vite-plus/lint/plugins. A separate @oxlint/plugins pin can drift from Vite+.",
);

console.log(`Vite+ ${packageJson.devDependencies["vite-plus"]} toolchain contract is aligned.`);
