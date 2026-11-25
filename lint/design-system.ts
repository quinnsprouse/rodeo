import type { OxlintConfig } from "vite-plus/lint";

// why: UI SDK is the only headless library here, and lint/layers.ts already bans Base UI with the
// steps to convert it, so listing Base UI too would give two answers for one import.
const librariesOnlyTheKitImports = ["@ui-sdk/react"];

export const designSystemRules: NonNullable<OxlintConfig["rules"]> = {
  "design-system/closed-variants": "error",
  "design-system/icon-button-label": "error",
  "design-system/no-boolean-variants": "error",
  "design-system/no-important": "error",
  "design-system/no-reach-in-selectors": "error",
  "design-system/no-rebuilt-primitives": "error",
  "design-system/primitive-naming": "error",
  "design-system/wrapped-libraries": ["error", { libraries: librariesOnlyTheKitImports }],
};

export const declinedDesignSystemRules = {
  "design-system/classname-passthrough":
    "TypeScript and no-unused-vars already reject a className prop that is never used, and one stray reference to it satisfies this rule.",
  "design-system/complete-composition":
    "It checks only components imported from src/components/ui, and the kit has no component with required parts yet. Turn it on with the first one.",
  "design-system/index-in-sync":
    "The kit is a handful of files and docs/agents/UI_MOTION.md already sends agents to the folder. An index is worth keeping in sync once the kit is large enough to scan badly.",
  "design-system/known-tokens":
    "shadcn/no-unknown-classes checks every class against the theme, not only color steps.",
  "design-system/layout-only-classname":
    "shadcn/no-restyle reports the same mistake and names the variants to use instead.",
  "design-system/no-cross-surface-imports":
    "src/components has no per-feature folders, and lint/layers.ts already draws the kit, app, and demo boundaries.",
  "design-system/no-deprecated":
    "It needs a map of renamed components, and the starter has none. typescript/no-deprecated covers annotated APIs.",
  "design-system/no-duplicate-primitives":
    "A matching file name does not prove a copy, and a renamed copy passes. no-rebuilt-primitives and wrapped-libraries catch the real rebuilds.",
  "design-system/no-inline-style":
    "shadcn/no-inline-styles reports the same mistake and teaches the CSS custom property that fixes it.",
  "design-system/no-raw-values":
    "shadcn/no-raw-colors and shadcn/no-arbitrary-values already reject raw colors and appearance values. This rule also rejects layout lengths such as max-w-[520px], which the starter allows, and its fix renames the number to max-w-130.",
  "design-system/no-template-classname":
    "Its message says to wrap the template in cn(), which still leaves Tailwind unable to see an interpolated class. shadcn/require-static-classes reports the real hazard.",
  "design-system/no-theme-overrides":
    "It reads the theme's font sizes as colors, so dark:text-m fails.",
  "design-system/one-way-imports":
    "lint/layers.ts enforces the same direction and also knows the demo boundary, server modules, and the Icon import the kit is allowed.",
  "design-system/prefer-shorthand":
    "Replacing h-screen with h-dvh changes how a page resizes, so it needs a person's decision, and the other two checks are spelling.",
  "design-system/semantic-tokens-only":
    "The Untitled theme names its own steps neutral-4 and neutral-6, and src/styles/app.css exposes them on purpose. The rule reads them as Tailwind's raw palette.",
  "design-system/single-export-default":
    "import/no-default-export is on, so the two rules contradict each other.",
};
