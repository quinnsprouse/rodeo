import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite-plus";

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
    },
    jsPlugins: [
      { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
      { name: "testing-library", specifier: "eslint-plugin-testing-library" },
      { name: "jest-dom", specifier: "eslint-plugin-jest-dom" },
      { name: "playwright", specifier: "eslint-plugin-playwright" },
      {
        name: "eslint-tanstack-router",
        specifier: "@tanstack/eslint-plugin-router",
      },
      {
        name: "eslint-tanstack-query",
        specifier: "@tanstack/eslint-plugin-query",
      },
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

      // Ban direct useEffect — use useMountEffect from @/hooks instead
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["useEffect"],
              message:
                "Import useMountEffect from @/hooks/use-mount-effect instead. See docs/agents/REACT_PATTERNS.md",
            },
          ],
        },
      ],

      // TanStack Router
      "eslint-tanstack-router/create-route-property-order": "warn",

      // TanStack Query
      "eslint-tanstack-query/exhaustive-deps": "warn",
      "eslint-tanstack-query/stable-query-client": "warn",
      "eslint-tanstack-query/no-rest-destructuring": "warn",
      "eslint-tanstack-query/no-unstable-deps": "warn",
      "eslint-tanstack-query/infinite-query-property-order": "warn",
      "eslint-tanstack-query/no-void-query-fn": "warn",
      "eslint-tanstack-query/mutation-property-order": "warn",

      // React hooks (React Compiler compatible rules)
      "react-hooks-js/rules-of-hooks": "error",
      "react-hooks-js/exhaustive-deps": "warn",
      "react-hooks-js/component-hook-factories": "error",
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
    overrides: [
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

  plugins: [tanstackStart(), nitro(), react(), tailwindcss()],
});
