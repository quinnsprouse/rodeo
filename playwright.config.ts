import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:43111",
    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.RODEO_E2E_PRODUCTION
      ? "npm run start"
      : "vp dev --host 127.0.0.1 --port 43111",
    env: process.env.RODEO_E2E_PRODUCTION
      ? { HOST: "127.0.0.1", NODE_ENV: "production", PORT: "43111" }
      : undefined,
    url: "http://127.0.0.1:43111",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
