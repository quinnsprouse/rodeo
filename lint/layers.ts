import type { OxlintOverride } from "vite-plus/lint";

type ImportPath = { name: string; importNames?: string[]; message: string };
type ImportPattern = { group: string[]; message: string };
type Restrictions = { paths?: ImportPath[]; patterns?: ImportPattern[] };
type ImportRestriction = ["error", { paths: ImportPath[]; patterns: ImportPattern[] }];
type Zone = { files: string[]; bans: string[]; message: string };

const sharedRestrictions = {
  paths: ["zod", "zod/v3", "zod/v4"].map((name) => ({
    name,
    message:
      "Import schemas from zod/mini. Search schemas and client env ship in the entry chunk, and classic Zod adds about 14 KB to every route.",
  })),
  patterns: [
    {
      group: [
        "lucide-react",
        "react-icons",
        "react-icons/*",
        "@heroicons/*",
        "@tabler/icons-react",
      ],
      message: "Icons come from @/components/icons (Hugeicons). See docs/agents/UI_MOTION.md",
    },
    {
      group: ["framer-motion"],
      message: "Import from motion/react; framer-motion is the legacy package name.",
    },
    {
      group: ["react-loading-skeleton", "react-content-loader"],
      message:
        "Loading skeletons come from skullet/react, which draws them from the real component so nothing moves when the data arrives. See docs/agents/UI_MOTION.md",
    },
    {
      group: ["@number-flow/*", "number-flow", "react-countup", "calligraph"],
      message:
        "Animate text and numbers that change in place with TextMorph from torph/react. See docs/agents/UI_MOTION.md",
    },
    {
      group: ["glimm/next"],
      message:
        "glimm/next is the Next.js adapter, and this app uses TanStack Router. Import GlimmProvider and useGlimm from glimm/react and navigate inside sweep(). See docs/agents/UI_MOTION.md",
    },
    {
      group: ["@/routes/*"],
      message:
        "Route modules are entry points that only the router imports. Move the shared code into src/components, src/hooks, or src/lib.",
    },
  ],
};

const testApis: ImportPattern = {
  group: ["vite-plus/test", "vitest", "vitest/*", "@testing-library/*", "@playwright/test"],
  message:
    "App code has no unit tests. Test the behavior end to end in e2e/ with Playwright, through the page or through the server's HTTP endpoints. See docs/agents/TESTING.md",
};

const nodeBuiltins: ImportPattern = {
  group: ["node:*"],
  message:
    "Node built-ins exist only on the server. Use them in a *.server.ts module, which TanStack Start keeps out of the client bundle, and call that module from a server function.",
};

const appBaseline = [testApis, nodeBuiltins];

const nodeGlobals = ["process", "Buffer", "global", "__dirname", "__filename", "require"].map(
  (name) => ({
    name,
    message:
      "Node globals exist only on the server. Read them in a *.server.ts module and call it from a server function. Secrets come from process.env there, parsed with a Zod Mini schema. See docs/agents/TANSTACK_START.md",
  }),
);

export const appFiles = "src/**";

const zones: Zone[] = [
  {
    files: ["src/lib/**", "src/config/**"],
    bans: ["@/components/*", "@/hooks/*"],
    message:
      "src/lib and src/config sit below components and hooks and cannot import them. Move the shared code into src/lib, or pass it in as an argument.",
  },
  {
    files: ["src/hooks/**"],
    bans: ["@/components/*"],
    message:
      "Hooks sit below components and cannot import them. Move the shared code into src/hooks or src/lib.",
  },
  {
    files: ["src/components/ui/**"],
    bans: ["@/components/*", "!@/components/ui/*", "!@/components/icons"],
    message:
      "The UI kit cannot depend on app components. Pass app content in through props or children.",
  },
];

// why: Oxlint replaces a rule's options in an override instead of merging them, so each layer
// repeats the shared restrictions.
export function restrictImports({
  paths = [],
  patterns = [],
}: Restrictions = {}): ImportRestriction {
  return [
    "error",
    {
      paths: [...sharedRestrictions.paths, ...paths],
      patterns: [...sharedRestrictions.patterns, ...patterns],
    },
  ];
}

// why: TanStack Start keeps *.server.ts modules out of the client bundle, so they may use Node
// built-ins and globals.
const serverModules = "*.server.ts";

function layerPair(
  files: string[],
  excludeFiles: string[],
  bans: ImportPattern[],
): OxlintOverride[] {
  return [
    {
      files,
      excludeFiles: [...excludeFiles, `**/${serverModules}`],
      rules: {
        "no-restricted-imports": restrictImports({ patterns: [...appBaseline, ...bans] }),
        "no-restricted-globals": ["error", ...nodeGlobals],
      },
    },
    {
      files: files.map((glob) => `${glob}/${serverModules}`),
      excludeFiles,
      rules: {
        "no-restricted-imports": restrictImports({ patterns: [testApis, ...bans] }),
        "no-restricted-globals": "off",
      },
    },
  ];
}

export function layerOverrides(): OxlintOverride[] {
  const zoned = zones.flatMap((zone) => zone.files);
  return [
    ...layerPair([appFiles], zoned, []),
    ...zones.flatMap(({ files, bans, message }) =>
      layerPair(files, [], [{ group: bans, message }]),
    ),
  ];
}
