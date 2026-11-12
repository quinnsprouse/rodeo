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

const viteConfig = `import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  plugins:
    lazyPlugins(async () => {
      const { tanstackStart } = await import("@tanstack/react-start/plugin/vite");
      return [tanstackStart()];
    }) ?? [],
});
`;

let fixtures = "";

function routeModule(path: string) {
  return `import { createFileRoute } from "@tanstack/react-router";\n\nexport const Route = createFileRoute("${path}")({});\n`;
}

function treeListing(routes: readonly string[]) {
  return routes.map((route) => `import { Route } from './routes/${route}'\n`).join("");
}

function generate(fixture: string) {
  return run(process.execPath, [join(fixture, routeTreeScript)], {
    cwd: join(fixture, "src", "routes"),
  });
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
  writeFileSync(inFixture("vite.config.ts"), viteConfig);
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

  it("runs the app's Vite plugins from any directory to add new routes and drop deleted ones, then leaves the current tree untouched", async ({
    expect,
  }) => {
    const app = routedApp("stale", ["home", "about"]);
    writeFileSync(join(app, routeTreeFile), treeListing(["__root", "home", "old"]));
    expect(await generate(app)).toMatchObject({
      status: 0,
      stdout: "Regenerated src/routeTree.gen.ts from src/routes.\n",
    });
    expect(routeTree(app)).toContain("from './routes/about'");
    expect(routeTree(app)).not.toContain("./routes/old");
    expect(routeTree(app)).toContain("declare module '@tanstack/react-start'");
    expect(readdirSync(join(app, "src", "routes")).toSorted()).toEqual([
      "__root.tsx",
      "about.tsx",
      "home.tsx",
    ]);
    const { mtimeMs } = statSync(join(app, routeTreeFile));
    expect(await generate(app)).toMatchObject({ status: 0, stdout: "" });
    expect(statSync(join(app, routeTreeFile)).mtimeMs).toBe(mtimeMs);
  });

  it("fails with the router's own error and keeps the old tree when a route file is invalid", async ({
    expect,
  }) => {
    const app = routedApp("invalid", ["home"]);
    const staleTree = treeListing(["__root"]);
    writeFileSync(join(app, routeTreeFile), staleTree);
    writeFileSync(join(app, "src/routes/(group).tsx"), routeModule("/"));
    const { status, stderr } = await generate(app);
    expect(status).toBe(1);
    expect(stderr).toContain("A route configuration for a route group was found");
    expect(stderr).toContain(
      "Could not regenerate src/routeTree.gen.ts: the TanStack Start plugin in vite.config.ts ran but left it out of date with src/routes.",
    );
    expect(routeTree(app)).toBe(staleTree);
  });
});
