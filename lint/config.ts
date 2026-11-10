import type { OxlintConfig } from "vite-plus/lint";

import { generatedFiles } from "#tooling/project";

import { lintExceptions } from "./exceptions";
import { appFiles, layerOverrides, restrictImports } from "./layers";
import { commentScopes, rodeoPlugin, rodeoRules } from "./rodeo-rules";

const builtinPlugins = [
  "typescript",
  "oxc",
  "unicorn",
  "react",
  "react-perf",
  "jsx-a11y",
  "import",
  "promise",
  "node",
  "vitest",
] as const;

const jsPlugins = [
  { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
  { name: "playwright", specifier: "eslint-plugin-playwright" },
  { name: "shadcn", specifier: "@shadcn/lint" },
  { name: "eslint-tanstack-router", specifier: "@tanstack/eslint-plugin-router" },
  rodeoPlugin,
] as const;

export type LintNamespace =
  | "eslint"
  | (typeof builtinPlugins)[number]
  | (typeof jsPlugins)[number]["name"];

const browserTests = "e2e/**/*.{ts,tsx}";

const playwrightRules = {
  "playwright/expect-expect": "error",
  "playwright/missing-playwright-await": "error",
  "playwright/no-conditional-expect": "error",
  "playwright/no-conditional-in-test": "error",
  "playwright/no-duplicate-hooks": "error",
  "playwright/no-duplicate-slow": "error",
  "playwright/no-element-handle": "error",
  "playwright/no-eval": "error",
  "playwright/no-focused-test": "error",
  "playwright/no-force-option": "error",
  "playwright/no-nested-step": "error",
  "playwright/no-networkidle": "error",
  "playwright/no-page-pause": "error",
  "playwright/no-skipped-test": "error",
  "playwright/no-standalone-expect": "error",
  "playwright/no-unsafe-references": "error",
  "playwright/no-unused-locators": "error",
  "playwright/no-useless-await": "error",
  "playwright/no-useless-not": "error",
  "playwright/no-wait-for-navigation": "error",
  "playwright/no-wait-for-selector": "error",
  "playwright/no-wait-for-timeout": "error",
  "playwright/prefer-hooks-in-order": "error",
  "playwright/prefer-hooks-on-top": "error",
  "playwright/prefer-locator": "error",
  "playwright/prefer-to-have-count": "error",
  "playwright/prefer-to-have-length": "error",
  "playwright/prefer-web-first-assertions": "error",
  "playwright/valid-describe-callback": "error",
  "playwright/valid-expect": "error",
  "playwright/valid-expect-in-promise": "error",
  "playwright/valid-test-tags": "error",
  "playwright/valid-title": "error",
} as const;

const reactHooksRules = {
  "react-hooks-js/rules-of-hooks": "error",
  "react-hooks-js/exhaustive-deps": "error",
  "react-hooks-js/config": "error",
  "react-hooks-js/error-boundaries": "error",
  "react-hooks-js/gating": "error",
  "react-hooks-js/globals": "error",
  "react-hooks-js/immutability": "error",
  "react-hooks-js/incompatible-library": "error",
  "react-hooks-js/preserve-manual-memoization": "error",
  "react-hooks-js/purity": "error",
  "react-hooks-js/refs": "error",
  "react-hooks-js/set-state-in-effect": "error",
  "react-hooks-js/set-state-in-render": "error",
  "react-hooks-js/static-components": "error",
  "react-hooks-js/unsupported-syntax": "error",
  "react-hooks-js/todo": "error",
  "react-hooks-js/use-memo": "error",
  "react-hooks-js/void-use-memo": "error",
} as const;

export const lintConfig = {
  // why: Setting plugins replaces Oxlint's default set, so oxc and unicorn must stay listed.
  plugins: [...builtinPlugins],
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
  },
  env: {
    builtin: true,
    node: true,
    browser: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    respectEslintDisableDirectives: false,
  },
  jsPlugins: [...jsPlugins],
  rules: {
    "typescript/no-deprecated": "error",

    // why: The automatic JSX runtime (React 17+) does not need React in scope.
    "react/react-in-jsx-scope": "off",

    // why: Inline objects, functions, and JSX in props are normal in React 19. Motion props take
    // objects, Base UI composes through render={<Link />}, and React Compiler memoizes them.
    "react-perf/jsx-no-new-object-as-prop": "off",
    "react-perf/jsx-no-new-function-as-prop": "off",
    "react-perf/jsx-no-new-array-as-prop": "off",
    "react-perf/jsx-no-jsx-as-prop": "off",

    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],

    "no-restricted-imports": restrictImports(),
    "import/no-relative-parent-imports": "error",
    "import/no-default-export": "error",
    "import/no-cycle": "error",
    "unicorn/prefer-node-protocol": "error",

    "typescript/no-explicit-any": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/ban-ts-comment": [
      "error",
      { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
    ],
    "typescript/no-misused-promises": "error",
    "typescript/prefer-promise-reject-errors": "error",
    "typescript/only-throw-error": "error",
    "typescript/use-unknown-in-catch-callback-variable": "error",
    "typescript/require-await": "error",
    "typescript/return-await": ["error", "error-handling-correctness-only"],
    "typescript/switch-exhaustiveness-check": [
      "error",
      { considerDefaultExhaustiveForUnions: false },
    ],
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "typescript/no-unsafe-type-assertion": "error",

    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-empty": "error",
    "no-alert": "error",
    "no-warning-comments": [
      "error",
      { terms: ["todo", "fixme", "xxx", "hack"], location: "anywhere" },
    ],
    complexity: ["error", 20],
    "max-depth": ["error", 4],
    "react/button-has-type": "error",
    "react/checked-requires-onchange-or-readonly": "error",
    "react/no-danger": "error",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "unicorn/no-array-for-each": "error",
    "unicorn/no-abusive-eslint-disable": "error",
    "vitest/no-conditional-in-test": "error",
    "vitest/no-identical-title": "error",

    ...rodeoRules,
    ...commentScopes.rules,

    // why: @shadcn/lint's class grammar doesn't parse the theme's named spacing keys, so it
    // reads a placement margin such as mt-m as a restyle.
    "shadcn/no-restyle": [
      "error",
      { allow: ["layout", "m-*", "mx-*", "my-*", "mt-*", "mr-*", "mb-*", "ml-*"] },
    ],
    "shadcn/no-raw-colors": "error",
    "shadcn/no-arbitrary-values": ["error", { allow: ["layout"] }],
    "shadcn/no-inline-styles": "error",
    "shadcn/no-unknown-classes": "error",
    "shadcn/require-static-classes": "error",

    "eslint-tanstack-router/create-route-property-order": "error",

    ...reactHooksRules,
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        // why: noImplicitReturns checks control flow correctly for exhaustive union switches.
        "typescript/consistent-return": "off",
        // why: valid-params matches any .catch() by name, so it rejects z.catch(schema, fallback).
        // TypeScript reports a real Promise method with the wrong arguments as TS2554.
        "promise/valid-params": "off",
      },
    },
    {
      // why: Plain JavaScript has no types, so the type-aware unsafe-* rules only add noise.
      files: ["**/*.{js,mjs,cjs}"],
      rules: {
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
      },
    },
    {
      // why: TanStack Start loads a custom server entry only from the default export of src/server.ts.
      files: ["src/server.ts"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      // why: Vite+, Knip, Playwright, commitlint, and React Doctor load a config file's default
      // export, Oxlint loads a JS plugin's, and Playwright loads its global setup's.
      files: ["*.config.ts", "lint/rules.js", "e2e/global-setup.ts"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      // why: Node scripts report progress and failures in the terminal.
      files: ["scripts/**"],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: [appFiles],
      rules: {
        "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      },
    },
    ...layerOverrides(),
    {
      // why: The shadcn kit owns its appearance and may need structural values such as
      // ring-[3px].
      files: ["src/components/ui/**"],
      rules: {
        "shadcn/no-restyle": "off",
        "shadcn/no-arbitrary-values": "off",
        "shadcn/require-static-classes": "off",
      },
    },
    {
      files: [browserTests],
      rules: playwrightRules,
    },
    {
      files: [browserTests],
      excludeFiles: ["e2e/fixtures.ts"],
      rules: {
        "no-restricted-imports": restrictImports({
          paths: [
            {
              name: "@playwright/test",
              importNames: ["test", "expect"],
              message:
                "Import test and expect from ./fixtures, which fails a test when its pages throw or log an error the test did not declare.",
            },
          ],
        }),
      },
    },
    ...commentScopes.overrides,
    ...lintExceptions(),
  ],
  ignorePatterns: ["dist", ".output", ...generatedFiles.map(({ path }) => path)],
} satisfies OxlintConfig;
