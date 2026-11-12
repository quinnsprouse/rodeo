import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { generatedRouteTree, routesDirectory, routeTreeIsCurrent } from "./lib/route-tree.mjs";

const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

// why: TanStack Router's Vite plugin writes the route tree when Vite resolves the config, and
// puts its temp files under the working directory.
async function resolveViteConfigAsBuild(root) {
  const { resolveConfig } = await import("vite-plus");
  process.chdir(root);
  await resolveConfig({ root }, "build", "production", "production");
}

async function updateRouteTree(root) {
  if (routeTreeIsCurrent(root)) return false;
  await resolveViteConfigAsBuild(root);
  if (!routeTreeIsCurrent(root)) {
    throw new Error(
      `the TanStack Start plugin in vite.config.ts ran but left it out of date with ${routesDirectory}. Fix the error printed above, or run \`vp build\` to see why.`,
    );
  }
  return true;
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
