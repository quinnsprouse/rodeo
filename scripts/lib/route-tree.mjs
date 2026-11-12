import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

// why: TanStack Start derives both paths from its srcDirectory default. The staleness check runs
// without loading Start, so it repeats them.
export const routesDirectory = "src/routes";
export const generatedRouteTree = "src/routeTree.gen.ts";
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
