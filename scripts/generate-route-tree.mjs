import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedRouteTree, routesDirectory, routeTreeIsCurrent } from "./lib/route-tree.mjs";

const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function packageDirectory(fromDirectory, name) {
  const require = createRequire(join(fromDirectory, "package.json"));
  return dirname(require.resolve(`${name}/package.json`));
}

function importBuiltModule(packageRoot, file) {
  return import(pathToFileURL(join(packageRoot, "dist", "esm", file)).href);
}

// why: TanStack Start exports neither its route generator config nor its route tree footer, so
// this loads the modules its Vite plugin builds them with, from the copy that plugin resolves.
async function loadStartRouterTools(root) {
  const start = packageDirectory(root, "@tanstack/react-start");
  const core = packageDirectory(start, "@tanstack/start-plugin-core");
  const generator = packageDirectory(core, "@tanstack/router-generator");
  const [{ Generator }, { parseStartConfig }, { resolveStartEntryPlan }, footer] =
    await Promise.all([
      importBuiltModule(generator, "index.js"),
      importBuiltModule(core, "schema.js"),
      importBuiltModule(core, "planning.js"),
      importBuiltModule(core, "start-router-plugin/route-tree-footer.js"),
    ]);
  return {
    Generator,
    parseStartConfig,
    resolveStartEntryPlan,
    buildRouteTreeFileFooterFromConfig: footer.buildRouteTreeFileFooterFromConfig,
  };
}

function startRouterConfig(tools, root) {
  const corePluginOpts = { framework: "react", defaultEntryPaths: {} };
  const startConfig = tools.parseStartConfig({}, corePluginOpts, root);
  const resolvedStartConfig = tools.resolveStartEntryPlan({
    root,
    startConfig,
    defaultEntryPaths: corePluginOpts.defaultEntryPaths,
  });
  const routeTreeFileFooter = tools.buildRouteTreeFileFooterFromConfig({
    generatedRouteTreePath: startConfig.router.generatedRouteTree,
    getConfig: () => ({ startConfig, resolvedStartConfig }),
    corePluginOpts,
  });
  return { ...startConfig.router, target: corePluginOpts.framework, routeTreeFileFooter };
}

function readTree(root) {
  const tree = join(root, generatedRouteTree);
  return existsSync(tree) ? readFileSync(tree, "utf8") : "";
}

async function updateRouteTree(root) {
  if (routeTreeIsCurrent(root)) return false;
  const before = readTree(root);
  const tools = await loadStartRouterTools(root);
  await new tools.Generator({ config: startRouterConfig(tools, root), root }).run();
  return readTree(root) !== before;
}

if (import.meta.main) {
  try {
    if (await updateRouteTree(projectRoot)) {
      console.log(`Regenerated ${generatedRouteTree} from ${routesDirectory}.`);
    }
  } catch (error) {
    console.error(
      `Could not regenerate ${generatedRouteTree}: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
