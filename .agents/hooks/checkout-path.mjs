import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { isWithin, physicalPath } from "./physical-path.mjs";

function containingCheckout(path, projectRoot) {
  for (let directory = dirname(path); directory !== projectRoot; directory = dirname(directory)) {
    if (!isWithin(directory, projectRoot)) return projectRoot;
    if (existsSync(join(directory, ".git"))) return directory;
  }
  return projectRoot;
}

function inCheckouts(path, projectRoot) {
  if (!isWithin(path, projectRoot)) return [];
  const checkout = containingCheckout(path, projectRoot);
  const roots = checkout === projectRoot ? [projectRoot] : [projectRoot, checkout];
  return roots.map((root) => ({ root, path: relative(root, path).replaceAll("\\", "/") }));
}

export function checkoutPaths(filePath, projectRoot) {
  return {
    physical: inCheckouts(physicalPath(projectRoot, filePath), projectRoot),
    logical: inCheckouts(resolve(projectRoot, filePath), projectRoot),
  };
}
