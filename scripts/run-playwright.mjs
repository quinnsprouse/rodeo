import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("@playwright/test/package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const binary = typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.playwright;

if (!binary) throw new Error("@playwright/test does not expose the Playwright CLI");

const args = process.argv.slice(2);
const productionIndex = args.indexOf("--production");
const production = productionIndex !== -1;
if (production) args.splice(productionIndex, 1);

const env = { ...process.env };
delete env.NO_COLOR;
if (production) env.RODEO_E2E_PRODUCTION = "1";

const result = spawnSync(process.execPath, [resolve(dirname(packagePath), binary), ...args], {
  env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
