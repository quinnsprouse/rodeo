import { appendFileSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";

import { exampleFeatureDirectory } from "#tooling/project";

const serverSecret = "JOURNEY_SECRET=example-feature-e2e-secret\n";

export function holdTheExampleFeature(appRoot, holdingRoot) {
  const held = join(holdingRoot, "example-feature");
  cpSync(join(appRoot, exampleFeatureDirectory), held, { recursive: true });
  return held;
}

export function addTheExampleFeature(appRoot, held) {
  cpSync(held, appRoot, { recursive: true });
  rmSync(held, { recursive: true });
  appendFileSync(join(appRoot, ".env.e2e"), serverSecret);
}
