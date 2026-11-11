import { realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, sep } from "node:path";

function realpathOrNull(path) {
  try {
    return realpathSync.native(path);
  } catch {
    return null;
  }
}

function resolveFrom(path, missing) {
  const real = realpathOrNull(path);
  const parent = dirname(path);
  if (real !== null || parent === path) return join(real ?? path, ...missing);
  return resolveFrom(parent, [basename(path), ...missing]);
}

export function physicalPath(base, path) {
  // why: The OS resolves `..` after a symlink from the link's target, and path.join would cancel
  // it against the link's name, so realpath gets the path unnormalized.
  return resolveFrom(isAbsolute(path) ? path : `${base}${sep}${path}`, []);
}
