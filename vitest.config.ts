import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["lint/**/*.test.ts", ".agents/hooks/*.test.ts"],
    // why: Vitest starts a worker thread faster than a forked process, which takes about a second
    // off each guardrail run. A test that needs its own process spawns one.
    pool: "threads",
  },
});
