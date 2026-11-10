import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // why: `vp test run --changed` follows imports, and these tests spawn or read these paths by
    // name instead, so a change to one reruns every test. Vitest matches them as absolute paths.
    forceRerunTriggers: [
      "**/package.json",
      "**/{vitest,vite}.config.*",
      "**/lint/**",
      "**/.claude/settings.json",
      "**/.codex/hooks.json",
      "**/scripts/generate-route-tree.mjs",
    ],
    include: ["lint/**/*.test.ts", ".agents/hooks/*.test.ts"],
  },
});
