import type { ReactDoctorConfig } from "react-doctor/api";

export default {
  // The same project rules oxlint runs, so `npm run doctor` and the PR comment show them too.
  plugins: ["./lint/rules.js"],
  rules: {
    "rodeo/no-disable-directives": "error",
    "rodeo/server-fn-requires-validator": "error",
    "rodeo/no-state-from-props": "error",
    "rodeo/no-module-scope-browser-globals": "error",
    "rodeo/no-window-navigation": "error",
  },
  ignore: {
    // Generated files. Oxlint ignores them too, through lint.ignorePatterns in vite.config.ts.
    // Without .output here, a scan after `npm run build` reports issues in bundled dependencies.
    files: ["src/routeTree.gen.ts", ".output/**", "dist/**"],
  },
} satisfies ReactDoctorConfig;
