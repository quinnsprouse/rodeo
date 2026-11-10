import { spawn } from "node:child_process";
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

const hooks = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(hooks, "..", "..");
const routeTreeScript = join("scripts", "generate-route-tree.mjs");
const routeTreeFile = join("src", "routeTree.gen.ts");

let fixture = "";
const inFixture = (path: string) => join(fixture, path);

function routeModule(path: string) {
  return `import { createFileRoute } from "@tanstack/react-router";\n\nexport const Route = createFileRoute("${path}")({});\n`;
}

function runNode(args: string[], input = "") {
  return new Promise<string>((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: fixture,
      env: { ...process.env, CLAUDE_PROJECT_DIR: fixture },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) =>
      status === 0
        ? resolvePromise(stdout)
        : reject(new Error(`node ${args.join(" ")} exited ${String(status)}\n${stderr}`)),
    );
    child.stdin.end(input);
  });
}

const generate = () => runNode([routeTreeScript]);
const routeTree = () => readFileSync(inFixture(routeTreeFile), "utf8");

function linkDependencies() {
  mkdirSync(inFixture("node_modules"));
  for (const name of readdirSync(join(repoRoot, "node_modules"))) {
    if (!name.startsWith(".")) {
      symlinkSync(join(repoRoot, "node_modules", name), inFixture(join("node_modules", name)));
    }
  }
}

beforeAll(async () => {
  fixture = realpathSync(mkdtempSync(join(tmpdir(), "rodeo-route-tree-")));
  mkdirSync(inFixture(join("src", "routes")), { recursive: true });
  mkdirSync(inFixture("scripts"));
  linkDependencies();
  cpSync(join(repoRoot, routeTreeScript), inFixture(routeTreeScript));
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
  await generate();
}, 30_000);

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe("route tree regeneration", { timeout: 30_000 }, () => {
  it("lists a route that an edit tool adds, so the agent sees no errors", async ({ expect }) => {
    writeFileSync(inFixture("src/routes/about.tsx"), routeModule("/about"));
    const feedback = await runNode(
      [join(hooks, "post-edit.mjs")],
      JSON.stringify({
        hook_event_name: "PostToolUse",
        tool_name: "Write",
        tool_input: { file_path: inFixture("src/routes/about.tsx") },
      }),
    );
    expect(feedback).toBe("");
    expect(routeTree()).toContain("from './routes/about'");
    expect(routeTree()).toContain("declare module '@tanstack/react-start'");
  });

  it("drops a deleted route, then leaves the current tree untouched", async ({ expect }) => {
    rmSync(inFixture("src/routes/old.tsx"));
    expect(await generate()).toBe("Regenerated src/routeTree.gen.ts from src/routes.\n");
    expect(routeTree()).not.toContain("./routes/old");
    const { mtimeMs } = statSync(inFixture(routeTreeFile));
    expect(await generate()).toBe("");
    expect(statSync(inFixture(routeTreeFile)).mtimeMs).toBe(mtimeMs);
  });
});
