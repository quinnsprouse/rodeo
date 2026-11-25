import { expect, test } from "./fixtures";
import { callTool, openWithWebMcp } from "./web-mcp";

test("a browser agent finds the theme switch and presses it through WebMCP", async ({ page }) => {
  await openWithWebMcp(page, "/");

  expect(await callTool(page, "snapshot", {})).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        component: "button",
        label: "Switch to dark theme",
        actions: ["press"],
      }),
    ]),
  );

  expect(
    await callTool(page, "act", { steps: [{ ref: "Switch to dark theme", action: "press" }] }),
  ).toMatchObject({ ok: true });
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("a browser without WebMCP never downloads the agent bridge", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(new URL(request.url()).pathname));
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();

  expect(requested.filter((path) => path.includes("agent-bridge"))).toEqual([]);
});
