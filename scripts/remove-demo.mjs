import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const self = "scripts/remove-demo.mjs";

const demoPaths = [
  "src/demo",
  "src/routes/(demo)",
  "e2e/demo-landing.spec.ts",
  "e2e/demo-philosophy.spec.ts",
  "public/stickers",
  "public/og-rationale.png",
];

const lines = (...text) => text.join("\n");

const kitEdits = [
  {
    file: "src/styles/app.css",
    find: '\n@import "../demo/demo.css";\n',
    replace: "",
  },
  {
    file: "lint/exceptions.ts",
    find: 'files: ["src/components/stickers/**", "src/demo/stickers/**"],',
    replace: 'files: ["src/components/stickers/**"],',
  },
  {
    file: "lint/exceptions.ts",
    find: lines(
      "  {",
      '    files: ["src/demo/landing/swap-chip-motion.tsx"],',
      '    rules: ["react-doctor/no-layout-property-animation"],',
      '    why: "CSS cannot composite width, and the hero chip has to resize so the sentence reflows around each word.",',
      "  },",
      "",
    ),
    replace: "",
  },
  { file: "README.md", section: "### Remove the demo", replace: "" },
];

const starterHome = {
  file: "src/routes/index.tsx",
  source: `import { createFileRoute } from "@tanstack/react-router";

import { ThemeToggle } from "@/components/theme-toggle";
import { Snippet } from "@/components/ui/snippet";
import { fonts, preloadFont } from "@/config/fonts";
import { site } from "@/config/site";

export const Route = createFileRoute("/")({
  staticData: {
    page: {
      structuredData: ({ url, description }) => ({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": \`\${url}#website\`,
        url,
        name: site.name,
        description,
      }),
    },
  },
  head: () => ({
    links: [preloadFont(fonts.bold), preloadFont(fonts.mono)],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 flex justify-end px-l pt-s sm:px-xl sm:pt-l">
        <ThemeToggle />
      </header>
      <main
        id="main"
        className="flex min-h-svh flex-col items-center justify-center gap-l px-m text-center"
      >
        <div className="space-y-xs">
          <h1 className="font-brand text-xl font-heavy text-balance">{site.name}</h1>
          <p className="text-muted-foreground">{site.tagline}</p>
        </div>
        <Snippet text="npm run dev" />
      </main>
    </>
  );
}
`,
};

const read = (file) => readFileSync(join(root, file), "utf8");

function occurrences(text, find) {
  return text.split(find).length - 1;
}

function sectionText(file, heading) {
  const text = read(file);
  const start = text.indexOf(`\n${heading}\n`) + 1;
  if (start === 0) return heading;
  const nextHeading = text.indexOf("\n## ", start);
  return text.slice(start, nextHeading === -1 ? text.length : nextHeading + 1);
}

function textToFind({ file, find, section }) {
  return section === undefined ? find : sectionText(file, section);
}

function editProblems() {
  return kitEdits
    .filter(
      (edit) =>
        !existsSync(join(root, edit.file)) || occurrences(read(edit.file), textToFind(edit)) !== 1,
    )
    .map((edit) => `${edit.file}: expected this text exactly once:\n${edit.find ?? edit.section}`);
}

function preflightProblems() {
  const missing = [...demoPaths, self]
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: expected the demo here, and it is missing.`);
  const homeTaken = existsSync(join(root, starterHome.file))
    ? [`${starterHome.file}: already exists, so the starter home would overwrite it.`]
    : [];
  return [...missing, ...editProblems(), ...homeTaken];
}

function applyKitEdits() {
  for (const edit of kitEdits) {
    writeFileSync(
      join(root, edit.file),
      read(edit.file).replace(textToFind(edit), () => edit.replace),
    );
  }
}

function regenerateRouteTree() {
  const result = spawnSync(process.execPath, ["scripts/generate-route-tree.mjs"], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("scripts/generate-route-tree.mjs failed.");
}

function removeDemo() {
  const problems = preflightProblems();
  if (problems.length > 0) {
    console.error(`Nothing was changed. The demo is not in the state this script expects:\n`);
    for (const problem of problems) console.error(`${problem}\n`);
    process.exitCode = 1;
    return;
  }
  applyKitEdits();
  for (const path of demoPaths) rmSync(join(root, path), { recursive: true });
  writeFileSync(join(root, starterHome.file), starterHome.source);
  regenerateRouteTree();
  rmSync(join(root, self));
  console.log("Removed the demo. Run npm run check:push to verify the starter.");
}

if (import.meta.main) removeDemo();
