import { spawnSync } from "node:child_process";
import { existsSync, globSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { exampleFeatureDirectory } from "#tooling/project";

const root = fileURLToPath(new URL("../..", import.meta.url));
const routeTreeGenerator = "scripts/generate-route-tree.mjs";
const ownFiles = [
  "scripts/remove-demo.mjs",
  "scripts/lib/demo-removal.mjs",
  "lint/remove-demo.repo.test.ts",
];
const demoPaths = [
  "src/demo",
  "src/routes/(demo)",
  "public/stickers",
  "public/og-rationale.png",
  exampleFeatureDirectory,
];
const demoSpecs = "e2e/demo-*.spec.ts";
const demoReference = /src\/demo\/|src\/routes\/\(demo\)|\.\.\/demo\//;

const starterHome = {
  file: "src/routes/index.tsx",
  source: `import { createFileRoute } from "@tanstack/react-router";

import { StarterHome, starterHead, starterPage } from "@/components/starter-home";

export const Route = createFileRoute("/")({
  staticData: { page: starterPage },
  head: starterHead,
  component: StarterHome,
});
`,
};

const read = (file) => readFileSync(join(root, file), "utf8");

function withoutSection(text, heading) {
  const start = text.indexOf(`\n${heading}\n`) + 1;
  if (start === 0) return text;
  const next = text.indexOf("\n## ", start);
  return text.slice(0, start) + (next === -1 ? "" : text.slice(next + 1));
}

function onlyDemoFiles(files) {
  return [...files.matchAll(/"([^"]+)"/g)].every(([, file]) => demoReference.test(file));
}

function withoutDemoExceptions(text) {
  return text.replaceAll(
    /^ {2}\{\n {4}files: \[([^\]\n]*)\],\n[\s\S]*?^ {2}\},\n/gm,
    (entry, files) => (onlyDemoFiles(files) ? "" : entry),
  );
}

const kitEdits = [
  {
    file: "src/styles/app.css",
    edit: (text) => text.replace('\n@import "../demo/demo.css";\n', ""),
  },
  { file: "lint/exceptions.ts", edit: withoutDemoExceptions },
  { file: "README.md", edit: (text) => withoutSection(text, "### Remove the demo") },
];

function demoFiles() {
  return [...demoPaths, ...globSync(demoSpecs, { cwd: root })];
}

function editProblems() {
  return kitEdits.flatMap(({ file, edit }) => {
    if (!existsSync(join(root, file))) return [`${file}: missing, so this script can't edit it.`];
    const leftover = edit(read(file))
      .split("\n")
      .filter((line) => demoReference.test(line));
    return leftover.length === 0
      ? []
      : [`${file}: still refers to the demo after this script's edit:\n${leftover.join("\n")}`];
  });
}

export function preflightProblems() {
  const missing = [...demoPaths, ...ownFiles]
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: expected the demo here, and it is missing.`);
  const specs =
    globSync(demoSpecs, { cwd: root }).length > 0 ? [] : [`${demoSpecs}: no demo specs.`];
  const homeTaken = existsSync(join(root, starterHome.file))
    ? [`${starterHome.file}: already exists, so the starter home would overwrite it.`]
    : [];
  return [...missing, ...specs, ...editProblems(), ...homeTaken];
}

function routeTreeRegenerated() {
  const result = spawnSync(process.execPath, [routeTreeGenerator], { cwd: root, stdio: "inherit" });
  return result.status === 0;
}

export function removeDemo() {
  for (const { file, edit } of kitEdits) writeFileSync(join(root, file), edit(read(file)));
  for (const path of demoFiles()) rmSync(join(root, path), { recursive: true });
  writeFileSync(join(root, starterHome.file), starterHome.source);
  if (!routeTreeRegenerated()) {
    return [
      `Fix the error above, then run \`node ${routeTreeGenerator}\`.`,
      `Delete ${ownFiles.join(", ")}.`,
    ];
  }
  for (const file of ownFiles) rmSync(join(root, file));
  return [];
}
