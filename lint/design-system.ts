import type { OxlintConfig } from "vite-plus/lint";

const uiSdkPackages = ["@ui-sdk/react", "@ui-sdk/core"];

// why: Left to find the kit's files itself, outtrue sends a native checkbox to Input as soon as
// the kit has an Input and no Checkbox, and reads any fixed inset-0 layer as a rebuilt Dialog
// as soon as the kit has one. Every control is named here and the overlay guess is off.
const kitComponentForEachNativeControl = {
  button: "Button",
  input: "Input",
  "input[type=checkbox]": "Checkbox",
  "input[type=radio]": "Radio",
  "input[type=range]": "Slider",
  "input[type=file]": "",
  "input[type=hidden]": "",
  select: "Select",
  textarea: "Textarea",
};

export const designSystemRules: NonNullable<OxlintConfig["rules"]> = {
  "design-system/closed-variants": "error",
  "design-system/icon-button-label": "error",
  "design-system/no-boolean-variants": "error",
  "design-system/no-important": "error",
  "design-system/no-rebuilt-primitives": [
    "error",
    { elements: kitComponentForEachNativeControl, overlay: "" },
  ],
  "design-system/primitive-naming": "error",
  "design-system/wrapped-libraries": ["error", { libraries: uiSdkPackages }],
};

export const declinedDesignSystemRules = {
  "design-system/classname-passthrough":
    "Any reference to className satisfies it, and a destructured className that is never used is already an unused-variable error.",
  "design-system/complete-composition":
    "It reports nothing until each component's required parts are listed, and no kit component requires a particular child yet. Turn it on with the first one that does.",
  "design-system/index-in-sync":
    "The kit is a handful of files and docs/agents/UI_MOTION.md already sends agents to the folder. An index is worth keeping in sync once the kit is large enough to scan badly.",
  "design-system/known-tokens":
    "shadcn/no-raw-colors and shadcn/no-unknown-classes already reject a class the theme does not define.",
  "design-system/layout-only-classname":
    "shadcn/no-restyle already rejects restyling a kit component and names the variants to use instead, so most mistakes would get two errors.",
  "design-system/no-cross-surface-imports":
    "src/components has one folder beside the kit, so there are no two features to keep apart, and lint/layers.ts already draws the kit, app, and demo boundaries.",
  "design-system/no-deprecated":
    "It needs a map of renamed components, props, or imports, and the starter has none. typescript/no-deprecated covers annotated APIs.",
  "design-system/no-duplicate-primitives":
    "A matching file name does not prove a copy, and a renamed copy passes.",
  "design-system/no-reach-in-selectors":
    "It reads [&:nth-child(2)]:mt-m, which places the component itself, as reaching in, and it misses [&_svg:not([class*=size-])]:size-4, which does reach in.",
  "design-system/no-inline-style":
    "shadcn/no-inline-styles reports the same mistake and teaches the CSS custom property that fixes it.",
  "design-system/no-raw-values":
    "shadcn/no-raw-colors and shadcn/no-arbitrary-values already reject raw colors and appearance values. This rule also rejects layout lengths such as max-w-[520px], which the starter allows, and its fix renames the number to max-w-130.",
  "design-system/no-template-classname":
    "Its fix is to wrap the template in cn(), which hides an interpolated class without making it one Tailwind can see.",
  "design-system/no-theme-overrides":
    "It reads some of the theme's sizes as colors, so dark:text-m and dark:shadow-m fail.",
  "design-system/one-way-imports":
    "lint/layers.ts enforces the same direction and also knows the demo boundary, server modules, and the Icon import the kit is allowed.",
  "design-system/prefer-shorthand":
    "Its fixes change behavior: h-dvh resizes differently from h-screen, and z-10 is not z-[999]. Each needs a person's decision.",
  "design-system/semantic-tokens-only":
    "The Untitled theme names its own steps neutral-4 and neutral-6, and src/styles/app.css exposes them on purpose. The rule reads them as Tailwind's raw palette.",
  "design-system/single-export-default":
    "import/no-default-export is on, so the two rules contradict each other.",
};
