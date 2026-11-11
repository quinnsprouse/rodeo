import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it } from "vite-plus/test";

import { run } from "#tooling/run";

import { postEditFeedback } from "./post-edit.mjs";

const hooks = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(hooks, "..", "..");
const routeTreeScript = join("scripts", "generate-route-tree.mjs");
const routeTreeModule = join("scripts", "lib", "route-tree.mjs");
const routeTreeFile = join("src", "routeTree.gen.ts");

let fixtures = "";

function routeModule(path: string) {
  return `import { createFileRoute } from "@tanstack/react-router";\n\nexport const Route = createFileRoute("${path}")({});\n`;
}

async function generate(fixture: string) {
  const { status, stdout, stderr } = await run(process.execPath, [routeTreeScript], {
    cwd: fixture,
  });
  if (status !== 0) throw new Error(`node ${routeTreeScript} exited ${String(status)}\n${stderr}`);
  return stdout;
}

const routeTree = (fixture: string) => readFileSync(join(fixture, routeTreeFile), "utf8");

function linkDependencies(fixture: string) {
  mkdirSync(join(fixture, "node_modules"));
  for (const name of readdirSync(join(repoRoot, "node_modules"))) {
    if (!name.startsWith(".")) {
      symlinkSync(join(repoRoot, "node_modules", name), join(fixture, "node_modules", name));
    }
  }
}

async function routedApp(name: string) {
  const fixture = join(fixtures, name);
  const inFixture = (path: string) => join(fixture, path);
  mkdirSync(inFixture(join("src", "routes")), { recursive: true });
  mkdirSync(inFixture(join("scripts", "lib")), { recursive: true });
  linkDependencies(fixture);
  cpSync(join(repoRoot, routeTreeScript), inFixture(routeTreeScript));
  cpSync(join(repoRoot, routeTreeModule), inFixture(routeTreeModule));
  writeFileSync(inFixture("package.json"), '{ "name": "route-tree-fixture", "type": "module" }\n');
  writeFileSync(
    inFixture("tsconfig.json"),
    '{ "files": ["src/start.ts"], "compilerOptions": { "noEmit": true, "types": [] } }\n',
  );
  writeFileSync(inFixture("src/router.tsx"), "export function getRouter() {\n  return null;\n}\n");
  writeFileSync(inFixture("src/start.ts"), "export const startInstance = null;\n");
  writeFileSync(
    inFixture("src/routes/__root.tsx"),
    'import { createRootRoute } from "@tanstack/react-router";\n\nexport const Route = createRootRoute();\n',
  );
  writeFileSync(inFixture("src/routes/index.tsx"), routeModule("/"));
  writeFileSync(inFixture("src/routes/old.tsx"), routeModule("/old"));
  await generate(fixture);
  return fixture;
}

const apps = { added: "", deleted: "" };

beforeAll(async () => {
  fixtures = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-route-tree-")));
  apps.added = await routedApp("added");
  apps.deleted = join(fixtures, "deleted");
  cpSync(apps.added, apps.deleted, { recursive: true, verbatimSymlinks: true });
}, 30_000);

afterAll(() => {
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("route tree regeneration", { timeout: 30_000 }, () => {
  it("lists a route that an edit tool adds, so the agent sees no errors", async ({ expect }) => {
    const added = join(apps.added, "src/routes/about.tsx");
    writeFileSync(added, routeModule("/about"));
    const feedback = await postEditFeedback(
      { hook_event_name: "PostToolUse", tool_name: "Write", tool_input: { file_path: added } },
      { root: apps.added },
    );
    expect(feedback).toBeNull();
    expect(routeTree(apps.added)).toContain("from './routes/about'");
    expect(routeTree(apps.added)).toContain("declare module '@tanstack/react-start'");
  });

  it("drops a deleted route, then leaves the current tree untouched", async ({ expect }) => {
    rmSync(join(apps.deleted, "src/routes/old.tsx"));
    expect(await generate(apps.deleted)).toBe(
      "Regenerated src/routeTree.gen.ts from src/routes.\n",
    );
    expect(routeTree(apps.deleted)).not.toContain("./routes/old");
    const { mtimeMs } = statSync(join(apps.deleted, routeTreeFile));
    expect(await generate(apps.deleted)).toBe("");
    expect(statSync(join(apps.deleted, routeTreeFile)).mtimeMs).toBe(mtimeMs);
  });
});
