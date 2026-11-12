import { defineConfig, lazyPlugins } from "vite-plus";

import { tasks } from "#tooling/tasks";

import { lintConfig } from "./lint/config";

// why: TanStack Start hydrates with inline scripts, so the CSP has no script-src. Add one with a
// nonce before the app loads a third-party script.
const securityHeaders = {
  "content-security-policy":
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
};

const appStylesheet = "./src/styles/app.css";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
  staged: {
    "*": "vp check --fix",
  },
  run: {
    tasks,
  },

  fmt: {
    tabWidth: 2,
    semi: true,
    printWidth: 100,
    singleQuote: false,
    endOfLine: "lf",
    trailingComma: "all",
    sortImports: {},
    sortTailwindcss: {
      stylesheet: appStylesheet,
      attributes: ["class", "className"],
      functions: ["clsx", "cn", "cva", "tw"],
    },
    sortPackageJson: true,
    ignorePatterns: [
      "package-lock.json",
      "routeTree.gen.ts",
      "cn-tables.ts",
      ".output",
      "dist",
      ".tanstack/",
      ".tanstack-start/",
      // why: The Graphical registry installs these files, and keeping them byte-identical to the
      // downloaded revision makes a reinstall diff show only real changes.
      "GUI.md",
      "gui/",
      ".agents/skills/graphical-*/",
    ],
  },

  lint: lintConfig,

  // why: vp lint and vp fmt load this file on every run only to read their own blocks. Importing
  // the plugins there adds over a second to each agent edit, so they load only when Vite runs.
  // lazyPlugins returns undefined on those runs, which exactOptionalPropertyTypes rejects.
  plugins:
    lazyPlugins(async () => {
      const [
        { default: babel },
        { default: tailwindcss },
        { tanstackStart },
        { default: react, reactCompilerPreset },
        { cn: cnTables },
        { nitro },
      ] = await Promise.all([
        import("@rolldown/plugin-babel"),
        import("@tailwindcss/vite"),
        import("@tanstack/react-start/plugin/vite"),
        import("@vitejs/plugin-react"),
        import("cn/vite"),
        import("nitro/vite"),
      ]);

      return [
        tanstackStart({ importProtection: { behavior: "error" } }),
        nitro({
          compressPublicAssets: { gzip: true, brotli: true },
          routeRules: {
            "/**": { headers: securityHeaders },
          },
        }),
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
        cnTables({
          content: ["src/**/*.{ts,tsx}"],
          out: "src/lib/cn-tables.ts",
          css: appStylesheet,
        }),
      ];
    }) ?? [],
});
