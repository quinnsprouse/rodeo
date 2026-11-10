import type { OxlintOverride } from "vite-plus/lint";

import type { LintNamespace } from "./config";
import type { pluginName, RodeoRuleId } from "./rodeo-rules";

const doctorNamespace = "react-doctor";

type OxlintRuleId = `${Exclude<LintNamespace, typeof pluginName>}/${string}`;
type DoctorRuleId = `${typeof doctorNamespace}/${string}`;
type RuleId = RodeoRuleId | OxlintRuleId | DoctorRuleId;

type LintException = { files: string[]; rules: RuleId[]; why: string };

export const exceptions: LintException[] = [
  {
    files: ["src/config/env.ts"],
    rules: ["rodeo/no-import-meta-env"],
    why: "Vite exposes VITE_* variables only on import.meta.env, so the module that parses them into clientEnv has to read it.",
  },
  {
    files: ["src/components/stickers/**", "src/demo/stickers/**"],
    rules: ["shadcn/no-raw-colors"],
    why: "Stickers are fixed artwork, like an image, so their colors stay the same in light and dark mode instead of following the theme tokens.",
  },
  {
    files: ["src/components/ui/snippet.tsx"],
    rules: ["typescript/no-deprecated"],
    why: "Safari exposes navigator.clipboard only on HTTPS pages, so the copy button falls back to document.execCommand, the only copy API left on plain-HTTP previews.",
  },
  {
    files: ["scripts/fonts/audit.mjs"],
    rules: ["unicorn/consistent-function-scoping"],
    why: "Playwright serializes the function passed to page.evaluate and runs it in the browser, so its helpers must be nested inside it to exist there.",
  },
  {
    files: ["src/demo/landing/swap-chip-motion.tsx"],
    rules: ["react-doctor/no-layout-property-animation"],
    why: "CSS cannot composite width, and the hero chip has to resize so the sentence reflows around each word.",
  },
];

function runsInOxlint(rule: RuleId) {
  return !rule.startsWith(`${doctorNamespace}/`);
}

export function lintExceptions(): OxlintOverride[] {
  return exceptions.flatMap(({ files, rules }) => {
    const oxlintRules = rules.filter(runsInOxlint);
    if (oxlintRules.length === 0) return [];
    return [{ files, rules: Object.fromEntries(oxlintRules.map((rule) => [rule, "off"])) }];
  });
}
