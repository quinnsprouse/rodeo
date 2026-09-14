import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite-plus";

// Explicit inputs keep Vite Task caching reliable inside restricted agent sandboxes,
// where automatic file tracing may not be able to create its shared-memory channel.
const verificationInputs = [
  ".claude/**",
  ".codex/hooks/**",
  ".codex/hooks.json",
  ".env*",
  ".github/**",
  ".gitignore",
  ".nvmrc",
  ".vite-hooks/**",
  "AGENTS.md",
  "README.md",
  "commitlint.config.ts",
  "components.json",
  "docs/**",
  "doctor.config.ts",
  "e2e/**",
  "knip.config.ts",
  "lint/**",
  "package-lock.json",
  "package.json",
  "playwright.config.ts",
  "public/**",
  "scripts/**",
  "skills-lock.json",
  "src/**",
  "tsconfig*.json",
  "vite.config.ts",
  "vitest.config.ts",
];

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
  staged: {
    "*": "vp check --fix",
  },
  run: {
    tasks: {
      "verify:fast": {
        command: ["node scripts/check-toolchain.mjs", "vp check", "vp test run"],
        input: verificationInputs,
        env: ["VITE_*", "NODE_ENV"],
      },
      "verify:build": {
        command: ["tsc -b", "vp build --logLevel error"],
        dependsOn: ["verify:fast"],
        input: verificationInputs,
        output: [".output/**"],
        env: ["VITE_*", "NODE_ENV"],
      },
      "verify:dead-code": {
        command: "knip --reporter compact",
        dependsOn: ["verify:build"],
        input: verificationInputs,
      },
      "verify:push": {
        command: "playwright test",
        dependsOn: ["verify:dead-code"],
        cache: false,
      },
      "verify:template": {
        command: "node scripts/test-template.mjs",
        dependsOn: ["verify:push"],
        cache: false,
      },
      "verify:doctor": {
        command: "react-doctor --verbose --blocking warning",
        cache: false,
      },
      "verify:coverage": {
        command: ["node scripts/check-toolchain.mjs", "vp test run --coverage --reporter=dot"],
        dependsOn: ["verify:fast"],
        input: verificationInputs,
        output: ["coverage/**"],
        env: ["VITE_*", "NODE_ENV"],
      },
      "verify:ci": {
        command: ["vp run verify:doctor", "npm audit --audit-level=high"],
        dependsOn: ["verify:template", "verify:coverage"],
        cache: false,
      },
    },
  },

  // Oxfmt — https://oxc.rs/docs/guide/usage/formatter/config.html
  fmt: {
    tabWidth: 2,
    semi: true,
    printWidth: 100,
    singleQuote: false,
    endOfLine: "lf",
    trailingComma: "all",
    sortImports: {},
    sortTailwindcss: {
      stylesheet: "./src/styles/app.css",
      attributes: ["class", "className"],
      functions: ["clsx", "cn", "cva", "tw"],
    },
    sortPackageJson: true,
    ignorePatterns: [
      "package-lock.json",
      "routeTree.gen.ts",
      ".output",
      "dist",
      ".tanstack/",
      ".tanstack-start/",
    ],
  },

  // Oxlint — https://oxc.rs/docs/guide/usage/linter/config
  lint: {
    // NOTE: setting `plugins` overwrites oxlint's default set — keep "oxc" and "unicorn" listed
    plugins: [
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
    ],
    categories: {
      correctness: "error",
      suspicious: "warn",
      perf: "warn",
    },
    env: {
      builtin: true,
      node: true,
      browser: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
      // Warnings block: an agent never sees a yellow line it can ignore.
      denyWarnings: true,
      // Inline suppression is banned (rodeo/no-disable-directives); these make the ban airtight.
      reportUnusedDisableDirectives: "error",
      respectEslintDisableDirectives: false,
    },
    jsPlugins: [
      { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
      { name: "testing-library", specifier: "eslint-plugin-testing-library" },
      { name: "jest-dom", specifier: "eslint-plugin-jest-dom" },
      { name: "playwright", specifier: "eslint-plugin-playwright" },
      // Design-system rules for Tailwind + shadcn/ui — https://github.com/shadcn-ui/lint
      { name: "shadcn", specifier: "@shadcn/lint" },
      {
        name: "eslint-tanstack-router",
        specifier: "@tanstack/eslint-plugin-router",
      },
      // Project rules — docs/agents/LINT_RULES.md
      { name: "rodeo", specifier: "./lint/rules.js" },
    ],
    rules: {
      "no-deprecated": "warn",

      // Obsolete with the automatic JSX runtime (React 17+)
      "react/react-in-jsx-scope": "off",

      // Inline objects/functions in JSX are idiomatic in React 19 (and required by Motion props)
      "react-perf/jsx-no-new-object-as-prop": "off",
      "react-perf/jsx-no-new-function-as-prop": "off",
      "react-perf/jsx-no-new-array-as-prop": "off",

      // Side-effect imports are legitimate for styles and test matchers
      "import/no-unassigned-import": ["warn", { allow: ["**/*.css", "@testing-library/jest-dom"] }],

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "lucide-react",
                "react-icons",
                "react-icons/*",
                "@heroicons/*",
                "@tabler/icons-react",
              ],
              message:
                "Icons come from @/components/icons (Hugeicons). See docs/agents/UI_MOTION.md",
            },
            {
              group: ["framer-motion"],
              message: "Import from motion/react; framer-motion is the legacy package name.",
            },
          ],
        },
      ],
      "import/no-relative-parent-imports": "error",
      "import/no-default-export": "error",

      // Type-safety escape hatches agents reach for under pressure
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true },
      ],
      "typescript/no-misused-promises": "error",
      "typescript/prefer-promise-reject-errors": "error",
      // A new union member must be handled explicitly, even when a switch has a default.
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

      // Runtime footguns
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-empty": "error",
      "react/button-has-type": "error",
      "react/checked-requires-onchange-or-readonly": "error",
      "react/no-danger": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "unicorn/no-array-for-each": "error",
      "unicorn/no-abusive-eslint-disable": "error",

      // Project rules — docs/agents/LINT_RULES.md
      "rodeo/no-disable-directives": "error",
      "rodeo/server-fn-requires-validator": "error",
      "rodeo/no-state-from-props": "error",
      "rodeo/no-module-scope-browser-globals": "error",
      "rodeo/no-window-navigation": "error",

      // Design system (@shadcn/lint) — errors name the token, size, or variant to use instead.
      // Components and theme are discovered from components.json and src/styles/app.css.
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": ["error", { allow: ["layout"] }],
      "shadcn/no-inline-styles": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/require-static-classes": "error",

      // TanStack Router
      "eslint-tanstack-router/create-route-property-order": "warn",

      // React hooks (React Compiler compatible rules)
      "react-hooks-js/rules-of-hooks": "error",
      "react-hooks-js/exhaustive-deps": "error",
      "react-hooks-js/config": "error",
      "react-hooks-js/error-boundaries": "error",
      "react-hooks-js/gating": "error",
      "react-hooks-js/globals": "error",
      "react-hooks-js/immutability": "error",
      "react-hooks-js/incompatible-library": "warn",
      "react-hooks-js/preserve-manual-memoization": "error",
      "react-hooks-js/purity": "error",
      "react-hooks-js/refs": "error",
      "react-hooks-js/set-state-in-effect": "error",
      "react-hooks-js/set-state-in-render": "error",
      "react-hooks-js/static-components": "error",
      "react-hooks-js/unsupported-syntax": "warn",
      "react-hooks-js/use-memo": "error",
      "react-hooks-js/void-use-memo": "error",
    },
    // Every lint exception lives here with a reason. Inline disable comments are errors (ADR 0004).
    overrides: [
      {
        // noImplicitReturns checks control flow correctly for exhaustive union switches.
        files: ["**/*.{ts,tsx}"],
        rules: { "typescript/consistent-return": "off" },
      },
      {
        // Plain JavaScript has no types, so the type-aware unsafe-* family only adds noise there.
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
        // Tooling files: config default exports, Node scripts that print, and lint fixtures.
        files: ["*.config.ts", "lint/**", "scripts/**", ".claude/hooks/**", "e2e/**"],
        rules: {
          "import/no-default-export": "off",
          "no-console": "off",
          "unicorn/no-array-for-each": "off",
        },
      },
      {
        // The shadcn kit owns its appearance and may need structural values such as ring-[3px].
        // no-raw-colors and no-inline-styles stay on inside it.
        files: ["src/components/ui/**"],
        rules: {
          "shadcn/no-restyle": "off",
          "shadcn/no-arbitrary-values": "off",
          "shadcn/require-static-classes": "off",
        },
      },
      {
        files: ["src/**/*.{test,spec}.{ts,tsx}"],
        rules: {
          // React Testing Library
          "testing-library/await-async-events": "error",
          "testing-library/await-async-queries": "error",
          "testing-library/await-async-utils": "error",
          "testing-library/no-await-sync-events": "error",
          "testing-library/no-await-sync-queries": "error",
          "testing-library/no-container": "error",
          "testing-library/no-debugging-utils": "error",
          "testing-library/no-dom-import": "error",
          "testing-library/no-global-regexp-flag-in-query": "error",
          "testing-library/no-manual-cleanup": "error",
          "testing-library/no-node-access": "error",
          "testing-library/no-promise-in-fire-event": "error",
          "testing-library/no-render-in-lifecycle": "error",
          "testing-library/no-unnecessary-act": "error",
          "testing-library/no-wait-for-multiple-assertions": "error",
          "testing-library/no-wait-for-side-effects": "error",
          "testing-library/no-wait-for-snapshot": "error",
          "testing-library/prefer-find-by": "warn",
          "testing-library/prefer-presence-queries": "warn",
          "testing-library/prefer-query-by-disappearance": "warn",
          "testing-library/prefer-screen-queries": "error",
          "testing-library/render-result-naming-convention": "error",

          // jest-dom
          "jest-dom/prefer-checked": "error",
          "jest-dom/prefer-empty": "error",
          "jest-dom/prefer-enabled-disabled": "error",
          "jest-dom/prefer-focus": "error",
          "jest-dom/prefer-in-document": "error",
          "jest-dom/prefer-required": "error",
          "jest-dom/prefer-to-have-attribute": "error",
          "jest-dom/prefer-to-have-class": "error",
          "jest-dom/prefer-to-have-style": "error",
          "jest-dom/prefer-to-have-text-content": "error",
          "jest-dom/prefer-to-have-value": "error",
        },
      },
      {
        files: ["e2e/**/*.{ts,tsx}"],
        rules: {
          "playwright/expect-expect": "error",
          "playwright/missing-playwright-await": "error",
          "playwright/no-conditional-expect": "error",
          "playwright/no-conditional-in-test": "error",
          "playwright/no-duplicate-hooks": "error",
          "playwright/no-duplicate-slow": "error",
          "playwright/no-element-handle": "error",
          "playwright/no-eval": "error",
          "playwright/no-focused-test": "error",
          "playwright/no-force-option": "warn",
          "playwright/no-nested-step": "warn",
          "playwright/no-networkidle": "error",
          "playwright/no-page-pause": "error",
          "playwright/no-skipped-test": "warn",
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
          "playwright/prefer-locator": "warn",
          "playwright/prefer-to-have-count": "warn",
          "playwright/prefer-to-have-length": "warn",
          "playwright/prefer-web-first-assertions": "error",
          "playwright/valid-describe-callback": "error",
          "playwright/valid-expect": "error",
          "playwright/valid-expect-in-promise": "error",
          "playwright/valid-test-tags": "error",
          "playwright/valid-title": "error",
        },
      },
    ],
    ignorePatterns: ["dist", ".output", "routeTree.gen.ts"],
  },

  plugins: [
    tanstackStart({ importProtection: { behavior: "error" } }),
    nitro(),
    react(),
    tailwindcss(),
  ],
});
