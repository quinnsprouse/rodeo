import { ignoredDirectories } from "#tooling/project";

// why: Vite Task's automatic file tracing needs a shared-memory channel that restricted agent
// sandboxes may not allow, so caching depends on these explicit inputs.
const verificationInputs = ["**", ...ignoredDirectories.map((directory) => `!${directory}/**`)];

export const tasks = {
  "verify:fast": {
    command: [
      "node scripts/check-toolchain.mjs",
      "node scripts/generate-route-tree.mjs",
      "vp check",
      "vp test run",
    ],
    cache: {
      input: verificationInputs,
      output: ["src/routeTree.gen.ts"],
      env: ["VITE_*", "NODE_ENV"],
    },
  },
  "verify:build": {
    command: ["tsc -b", "vp build --mode e2e --logLevel error"],
    dependsOn: ["verify:fast"],
    cache: {
      input: verificationInputs,
      output: [".output/**"],
      env: ["VITE_*", "NODE_ENV"],
    },
  },
  "verify:dead-code": {
    command: "knip --reporter compact",
    dependsOn: ["verify:build"],
    cache: {
      input: verificationInputs,
    },
  },
  "verify:push": {
    command: "playwright test",
    dependsOn: ["verify:dead-code"],
    cache: false,
  },
  "verify:template": {
    command: "node scripts/test-template.mjs",
    dependsOn: ["verify:fast"],
    cache: false,
  },
  "verify:doctor": {
    command: "react-doctor",
    cache: false,
  },
  "verify:ci": {
    command: ["vp run verify:doctor", "npm audit --audit-level=high"],
    dependsOn: ["verify:template"],
    cache: false,
  },
};
