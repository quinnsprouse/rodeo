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
    file: "src/config/site.ts",
    find: lines(
      "export const philosophyMeta = {",
      '  path: "/philosophy",',
      '  title: "Rodeo Philosophy",',
      "  description:",
      '    "how i think about building with agents, and why rodeo drops code comments, unit tests, and long docs.",',
      "  image: {",
      '    path: "/og-rationale.png",',
      '    alt: "Rodeo Philosophy: how i think about building with agents. With coin, scissors, and codebase stickers.",',
      "  },",
      '  published: "2026-10-17",',
      "} satisfies PageMeta & { published: string };",
      "",
      "export const sitePages: PageMeta[] = [homeMeta, philosophyMeta];",
    ),
    replace: "export const sitePages: PageMeta[] = [homeMeta];",
  },
  {
    file: "src/config/site.ts",
    find: "export function pageMeta(",
    replace: "function pageMeta(",
  },
  {
    file: "src/lib/structured-data.ts",
    find: 'import { absoluteUrl, homeMeta, philosophyMeta, site } from "@/config/site";',
    replace: 'import { absoluteUrl, homeMeta, site } from "@/config/site";',
  },
  {
    file: "src/lib/structured-data.ts",
    find: lines(
      "export function philosophyStructuredData(origin: string) {",
      "  const url = absoluteUrl(philosophyMeta.path, origin);",
      "  return {",
      '    "@context": "https://schema.org",',
      '    "@type": "Article",',
      "    headline: philosophyMeta.title,",
      "    description: philosophyMeta.description,",
      "    url,",
      "    mainEntityOfPage: url,",
      "    image: absoluteUrl(philosophyMeta.image.path, origin),",
      "    datePublished: philosophyMeta.published,",
      "    author,",
      "  };",
      "}",
      "",
      "",
    ),
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
];

const starterHome = {
  file: "src/routes/index.tsx",
  source: `import { createFileRoute } from "@tanstack/react-router";

import { ThemeToggle } from "@/components/theme-toggle";
import { Snippet } from "@/components/ui/snippet";
import { clientEnv } from "@/config/env";
import { fonts, preloadFont } from "@/config/fonts";
import { site } from "@/config/site";
import { homeStructuredData, structuredDataScript } from "@/lib/structured-data";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [preloadFont(fonts.bold), preloadFont(fonts.mono)],
    scripts: clientEnv.VITE_APP_URL
      ? [structuredDataScript(homeStructuredData(clientEnv.VITE_APP_URL))]
      : [],
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

function editProblems() {
  return kitEdits
    .filter(
      ({ file, find }) => !existsSync(join(root, file)) || occurrences(read(file), find) !== 1,
    )
    .map(({ file, find }) => `${file}: expected this text exactly once:\n${find}`);
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
  for (const { file, find, replace } of kitEdits) {
    writeFileSync(
      join(root, file),
      read(file).replace(find, () => replace),
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
