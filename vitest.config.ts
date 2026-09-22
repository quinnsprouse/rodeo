import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // `vp test run --changed` follows imports. These tests spawn their subjects as processes
    // instead, so a change to one of these paths reruns every test.
    forceRerunTriggers: [
      "**/package.json/**",
      "**/{vitest,vite}.config.*/**",
      "lint/**",
      ".agents/hooks/**",
    ],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "lint/**/*.test.ts", ".agents/hooks/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/routeTree.gen.ts", "src/**/*.d.ts", "src/test/**"],
    },
  },
});
