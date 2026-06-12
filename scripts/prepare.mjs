import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

execFileSync("vp", ["config"], { stdio: "inherit" });

if (existsSync(".git")) {
  execFileSync("husky", { stdio: "inherit" });
} else {
  console.log("Skipping husky setup; .git not found.");
}
