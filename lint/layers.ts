import type { OxlintOverride } from "vite-plus/lint";

import { appUnitTestReason } from "#tooling/project";

type ImportPath = {
  name: string;
  importNames?: string[];
  allowTypeImports?: boolean;
  message: string;
};
type ImportPattern = { group: string[]; message: string };
type Restrictions = { paths?: ImportPath[]; patterns?: ImportPattern[]; allow?: string[] };
type ImportRestriction = ["error", { paths: ImportPath[]; patterns: ImportPattern[] }];
type Zone = { files: string[]; bans: string[]; message: string };

const iconModule = "src/components/icon.tsx";
const iconRenderer: ImportPath = {
  name: "@hugeicons/react",
  allowTypeImports: true,
  message:
    "Draw icons with Icon from @/components/icon, which gives them the theme's stroke width: <Icon icon={CheckIcon} />. See docs/agents/UI_MOTION.md",
};

const sharedRestrictions = {
  paths: [
    ...["zod", "zod/v3", "zod/v4"].map((name) => ({
      name,
      message:
        "Import schemas from zod/mini. Search schemas and client env ship in the entry chunk, and classic Zod adds about 14 KB to every route.",
    })),
    {
      name: "cn",
      message:
        'Import cn from @/lib/utils. The bare cn package knows Tailwind\'s default scales, not the theme\'s: it turns cn("text-s", "text-muted-foreground") into text-muted-foreground and keeps both classes of cn("p-m", "p-l"). shadcn add writes this import, so change it in each file the CLI adds.',
    },
    iconRenderer,
  ],
  patterns: [
    {
      group: [
        "lucide-react",
        "react-icons",
        "react-icons/*",
        "@heroicons/**",
        "@tabler/icons-react",
      ],
      message:
        "Import icons from @hugeicons/core-free-icons and draw them with Icon from @/components/icon. See docs/agents/UI_MOTION.md",
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
      group: ["@/routes/**"],
      message:
        "Route modules are entry points that only the router imports. Move the shared code into src/components, src/hooks, or src/lib.",
    },
  ],
};

const testApis: ImportPattern = {
  group: ["vite-plus/test", "vitest", "vitest/*", "@testing-library/*", "@playwright/test"],
  message: appUnitTestReason,
};

const nodeBuiltins: ImportPattern = {
  group: ["node:*", "node:*/**"],
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

const appFiles = "src/**";

const demoImports: ImportPattern = {
  group: [
    "@/demo",
    "@/demo/**",
    "./demo",
    "./demo/**",
    "./(demo)",
    "./(demo)/**",
    "./routes/(demo)",
    "./routes/(demo)/**",
  ],
  message:
    "Only src/demo and src/routes/(demo) import the demo, so deleting it leaves a working app. Move what this file needs out of src/demo, or pass it in as an argument.",
};

const kitZones: Zone[] = [
  {
    files: ["src/lib/**", "src/config/**"],
    bans: ["@/components/**", "@/hooks/**"],
    message:
      "src/lib and src/config sit below components and hooks and cannot import them. Move the shared code into src/lib, or pass it in as an argument.",
  },
  {
    files: ["src/hooks/**"],
    bans: ["@/components/**"],
    message:
      "Hooks sit below components and cannot import them. Move the shared code into src/hooks or src/lib.",
  },
  {
    files: ["src/components/ui/**"],
    bans: ["@/components/**", "!@/components/ui/**", "!@/components/icon"],
    message:
      "The UI kit cannot depend on app components. Pass app content in through props or children.",
  },
];

const demoFiles = ["src/demo/**", "src/routes/(demo)/**"];

// why: Oxlint replaces a rule's options in an override instead of merging them, so each layer
// repeats the shared restrictions.
export function restrictImports({
  paths = [],
  patterns = [],
  allow = [],
}: Restrictions = {}): ImportRestriction {
  const shared = sharedRestrictions.paths.filter(({ name }) => !allow.includes(name));
  return [
    "error",
    {
      paths: [...shared, ...paths],
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
  const zoned = [...kitZones.flatMap((zone) => zone.files), ...demoFiles];
  return [
    ...layerPair([appFiles], zoned, [demoImports]),
    ...kitZones.flatMap(({ files, bans, message }) =>
      layerPair(files, [], [{ group: bans, message }, demoImports]),
    ),
    ...layerPair(demoFiles, [], []),
    {
      files: [iconModule],
      rules: {
        "no-restricted-imports": restrictImports({
          patterns: [...appBaseline, demoImports],
          allow: [iconRenderer.name],
        }),
      },
    },
  ];
}
