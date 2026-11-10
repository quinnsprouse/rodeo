import type { ReactDoctorConfig } from "react-doctor/api";

import { rodeoRuleExceptions, rodeoRules } from "./lint/rodeo-rules";

export default {
  plugins: ["./lint/rules.js"],
  rules: rodeoRules,
  ignore: {
    // why: React Doctor does not read Oxlint's ignorePatterns or .gitignore. Without .output here,
    // a scan after `npm run build` reports issues in bundled dependencies, and without .scratch it
    // scans local experiments.
    files: ["src/routeTree.gen.ts", ".output/**", "dist/**", ".scratch/**"],
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
