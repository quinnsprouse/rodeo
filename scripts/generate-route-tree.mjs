import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, posix, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

// why: TanStack Start derives both paths from its srcDirectory default. The staleness check runs
// without loading Start, so it repeats them.
const routesDirectory = "src/routes";
const generatedRouteTree = "src/routeTree.gen.ts";
const routeImportPrefix = `./${posix.relative(posix.dirname(generatedRouteTree), routesDirectory)}/`;
const routeModuleExtension = /\.(?:tsx|ts|jsx|js|vue)$/;
const importedModule = /(?:from|import\()\s*(?<quote>["'])(?<specifier>.+?)\k<quote>/g;

export function isRouteFile(projectPath) {
  return projectPath.startsWith(`${routesDirectory}/`);
}

function isIgnoredName(name) {
  return name.startsWith(".") || name.startsWith("-");
}

function routeModulesOnDisk(root) {
  const directory = join(root, routesDirectory);
  if (!existsSync(directory)) return new Set();
  const modules = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => !entry.isDirectory() && routeModuleExtension.test(entry.name))
    .map((entry) => relative(directory, join(entry.parentPath, entry.name)).split(sep))
    .filter((segments) => !segments.some(isIgnoredName))
    .map((segments) => segments.join("/").replace(routeModuleExtension, ""));
  return new Set(modules);
}

function routeModulesInTree(source) {
  const modules = [...source.matchAll(importedModule)]
    .map((match) => match.groups.specifier)
    .filter((specifier) => specifier.startsWith(routeImportPrefix))
    .map((specifier) => specifier.slice(routeImportPrefix.length));
  return new Set(modules);
}

export function routeTreeIsCurrent(root) {
  const tree = join(root, generatedRouteTree);
  if (!existsSync(tree)) return false;
  const listed = routeModulesInTree(readFileSync(tree, "utf8"));
  return listed.symmetricDifference(routeModulesOnDisk(root)).size === 0;
}

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
    if (await updateRouteTree(process.cwd())) {
      console.log(`Regenerated ${generatedRouteTree} from ${routesDirectory}.`);
    }
  } catch (error) {
    console.error(
      `Could not regenerate ${generatedRouteTree}: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
