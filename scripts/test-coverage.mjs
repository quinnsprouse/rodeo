import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

import { versions } from "vite-plus/versions";

const require = createRequire(import.meta.url);
const vitePlusPackage = require("vite-plus/package.json");
const vitePlusBin = resolve(
  dirname(require.resolve("vite-plus/package.json")),
  vitePlusPackage.bin.vp,
);

const result = spawnSync(
  process.execPath,
  [vitePlusBin, "test", "run", "--coverage", ...process.argv.slice(2)],
  {
    env: { ...process.env, VP_VERSION: versions.vitest },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
