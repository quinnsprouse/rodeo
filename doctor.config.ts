import type { ReactDoctorConfig } from "react-doctor/api";

import { generatedGlobs, ignoredDirectories } from "#tooling/project";

import { exceptions } from "./lint/exceptions";
import { rodeoPlugin, rodeoRules } from "./lint/rodeo-rules";

export default {
  blocking: "warning",
  verbose: true,
  plugins: [rodeoPlugin.specifier],
  rules: rodeoRules,
  ignore: {
    // why: React Doctor reads neither Oxlint's ignorePatterns nor .gitignore, so generated files,
    // build output, and local experiments are listed here. Its changed-files scan also reaches the
    // Node tooling, where its React and server rules do not apply: a hook that formats a file
    // before it lints that file is not making a user wait twice.
    files: [
      ...generatedGlobs,
      ...ignoredDirectories.map((directory) => `${directory}/**`),
      ".agents/**",
      "scripts/**",
      "lint/**",
      "e2e/**",
      "*.config.ts",
    ],
    overrides: exceptions,
  },
} satisfies ReactDoctorConfig;
