import type { OxlintConfig } from "vite-plus/lint";

import { defaultCommentOptions, pluginName, rules } from "./rules.js";

export type RodeoRuleName = keyof typeof rules;

export type RodeoRuleId = `${typeof pluginName}/${RodeoRuleName}`;

export { pluginName };

const rodeoPluginPath = "./lint/rules.js";

export const rodeoPlugin = { name: pluginName, specifier: rodeoPluginPath } as const;

export function isRodeoRuleName(name: string): name is RodeoRuleName {
  return Object.hasOwn(rules, name);
}

function ruleId(name: RodeoRuleName): RodeoRuleId {
  return `${pluginName}/${name}`;
}

export const rodeoRules = Object.fromEntries(
  Object.keys(rules)
    .filter(isRodeoRuleName)
    .map((name) => [ruleId(name), "error" as const]),
);

export const commentScopes = {
  rules: { [ruleId("no-comments")]: ["error", { cause: "optional", minWords: 3 }] },
  overrides: [
    {
      files: ["src/**", "e2e/**"],
      rules: { [ruleId("no-comments")]: ["error", defaultCommentOptions] },
    },
  ],
} satisfies Pick<OxlintConfig, "rules" | "overrides">;
