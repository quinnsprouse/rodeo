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

function treeListing(routes: readonly string[]) {
  return routes.map((route) => `import { Route } from './routes/${route}'\n`).join("");
}

async function generate(fixture: string) {
  const { status, stdout, stderr } = await run(process.execPath, [join(fixture, routeTreeScript)], {
    cwd: join(fixture, "src", "routes"),
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

function routedApp(name: string, routes: readonly string[]) {
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
  for (const route of routes) {
    writeFileSync(inFixture(`src/routes/${route}.tsx`), routeModule(`/${route}`));
  }
  return fixture;
}

beforeAll(() => {
  fixtures = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-route-tree-")));
});

afterAll(() => {
  rmSync(fixtures, { recursive: true, force: true });
});

describe.concurrent("route tree regeneration", { timeout: 30_000 }, () => {
  it("lists a route that an edit tool adds, so the agent sees no errors", async ({ expect }) => {
    const app = routedApp("edited", ["home"]);
    const added = join(app, "src/routes/about.tsx");
    writeFileSync(added, routeModule("/about"));
    const feedback = await postEditFeedback(
      { hook_event_name: "PostToolUse", tool_name: "Write", tool_input: { file_path: added } },
      { root: app },
    );
    expect(feedback).toBeNull();
    expect(routeTree(app)).toContain("from './routes/about'");
  });

  it("adds new routes and drops deleted ones from any directory, then leaves the current tree untouched", async ({
    expect,
  }) => {
    const app = routedApp("stale", ["home", "about"]);
    writeFileSync(join(app, routeTreeFile), treeListing(["__root", "home", "old"]));
    expect(await generate(app)).toBe("Regenerated src/routeTree.gen.ts from src/routes.\n");
    expect(routeTree(app)).toContain("from './routes/about'");
    expect(routeTree(app)).not.toContain("./routes/old");
    expect(routeTree(app)).toContain("declare module '@tanstack/react-start'");
    const { mtimeMs } = statSync(join(app, routeTreeFile));
    expect(await generate(app)).toBe("");
    expect(statSync(join(app, routeTreeFile)).mtimeMs).toBe(mtimeMs);
  });
});
