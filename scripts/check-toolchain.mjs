import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const {
  version: vitePlusVersion,
  dependencies: vitePlusDependencies = {},
} = require("vite-plus/package.json");
const { versions: bundledTools } = require("vite-plus/versions");
const vitePlusCore = vitePlusDependencies.vite;
const vitestPin = packageJson.overrides.vitest;

function installedOxlint() {
  try {
    return require("oxlint/package.json").version;
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
    return bundledTools.oxlint;
  }
}

function pinVitePlusExpects(name) {
  return name === "vite" ? vitePlusCore : bundledTools[name];
}

function pinnedToVitePlus(name, spec) {
  return spec === packageJson.overrides[name] && spec === pinVitePlusExpects(name);
}

const secondCopies = ["dependencies", "devDependencies", "optionalDependencies"].flatMap((field) =>
  Object.entries(packageJson[field] ?? {})
    .filter(([name, spec]) => Object.hasOwn(bundledTools, name) && !pinnedToVitePlus(name, spec))
    .map(([name, spec]) => `${field}.${name}: ${spec}`),
);

assert.equal(packageJson.devDependencies["vite-plus"], vitePlusVersion);
assert.ok(
  vitePlusCore,
  `Vite+ ${vitePlusVersion} no longer lists vite as a dependency, so this check cannot tell which core the vite override must pin. Update scripts/check-toolchain.mjs to read the pin from where Vite+ now declares it.`,
);
assert.equal(
  packageJson.overrides.vite,
  vitePlusCore,
  `Set overrides.vite in package.json to ${vitePlusCore}, the core that Vite+ ${vitePlusVersion} depends on. Run vp migrate to write it.`,
);
assert.ok(
  vitestPin === undefined || vitestPin === pinVitePlusExpects("vitest"),
  `The vitest override must pin the Vitest that Vite+ bundles, ${bundledTools.vitest}. Run vp migrate to re-pin or remove it.`,
);
assert.deepEqual(
  secondCopies,
  [],
  `package.json installs a second copy of a tool Vite+ ${vitePlusVersion} ships (see vite-plus/versions): ${secondCopies.join(", ")}. Remove each one and run the tool through vp or import it from vite-plus. A second copy drifts from the version Vite+ runs.`,
);
const driftedPluginPins = Object.entries(packageJson.overrides)
  .filter(([, pin]) => typeof pin === "object" && pin.oxlint !== undefined)
  .filter(([, pin]) => pin.oxlint !== bundledTools.oxlint)
  .map(([plugin, pin]) => `overrides.${plugin}.oxlint: ${pin.oxlint}`);
assert.deepEqual(
  driftedPluginPins,
  [],
  `Each lint plugin must resolve to the Oxlint that Vite+ ${vitePlusVersion} ships, ${bundledTools.oxlint}: ${driftedPluginPins.join(", ")}. Set each one to ${bundledTools.oxlint} and reinstall.`,
);
assert.equal(
  installedOxlint(),
  bundledTools.oxlint,
  `node_modules/oxlint is not the ${bundledTools.oxlint} that Vite+ ${vitePlusVersion} ships, and vp lint runs the copy in node_modules. A lint plugin's peer dependency installed it. For that plugin, add overrides["<plugin>"].oxlint: "${bundledTools.oxlint}" to package.json and reinstall.`,
);
assert.equal(
  packageJson.devDependencies["@oxlint/plugins"],
  undefined,
  "Import the lint plugin API from vite-plus/lint/plugins. A separate @oxlint/plugins pin can drift from Vite+.",
);

console.log(`Vite+ ${packageJson.devDependencies["vite-plus"]} toolchain contract is aligned.`);
