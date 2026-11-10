import type { ReactDoctorConfig } from "react-doctor/api";

import { rodeoRuleExceptions, rodeoRules } from "./lint/rodeo-rules";

export default {
  plugins: ["./lint/rules.js"],
  rules: rodeoRules,
  ignore: {
    // why: React Doctor reads neither Oxlint's ignorePatterns nor .gitignore, so build output and
    // local experiments are listed here. Its changed-files scan also reaches the Node tooling,
    // where its React and server rules do not apply: a hook that formats a file before it lints
    // that file is not making a user wait twice.
    files: [
      "src/routeTree.gen.ts",
      ".output/**",
      "dist/**",
      ".scratch/**",
      ".agents/**",
      "scripts/**",
      "lint/**",
      "e2e/**",
      "*.config.ts",
    ],
    overrides: [
      ...rodeoRuleExceptions,
      {
        // why: CSS cannot composite width, and the hero chip has to resize so the sentence
        // reflows around each word.
        files: ["src/components/swap-chip-motion.tsx"],
        rules: ["react-doctor/no-layout-property-animation"],
      },
    ],
  },
} satisfies ReactDoctorConfig;
