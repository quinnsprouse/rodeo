import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import { gitHooksDirectory } from "#tooling/project";

if (!existsSync(".git")) {
  console.log("Git hooks skipped; run `git init && npm run setup` when you are ready.");
  process.exit(0);
}

execFileSync("vp", ["config", "--hooks-dir", gitHooksDirectory], { stdio: "inherit" });
