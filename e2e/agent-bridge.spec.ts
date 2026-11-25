import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

type BrowserTool = { name: string; execute: (input: object) => unknown };

declare global {
  interface Document {
    modelContext?: {
      tools: Map<string, BrowserTool>;
      registerTool: (tool: BrowserTool) => Promise<void>;
    };
  }
}

async function offerWebMcp(page: Page) {
  await page.addInitScript(() => {
    const tools = new Map<string, BrowserTool>();
    document.modelContext = {
      tools,
      registerTool: (tool) => {
        tools.set(tool.name, tool);
        return Promise.resolve();
      },
    };
  });
}

function registeredTools(page: Page) {
  return page.evaluate(() => [...(document.modelContext?.tools.keys() ?? [])].toSorted());
}

function callTool(page: Page, name: string, input: object) {
  return page.evaluate(
    ([toolName, toolInput]) => document.modelContext?.tools.get(toolName)?.execute(toolInput),
    [name, input] as const,
  );
}

test("a browser agent reads the checks demo and switches its stage through WebMCP", async ({
  page,
}) => {
  await offerWebMcp(page);
  await page.goto("/");
  await expect.poll(() => registeredTools(page)).toEqual(["act", "query", "snapshot"]);

  expect(await callTool(page, "snapshot", {})).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        component: "tabs",
        label: "When Rodeo checks",
        value: "edit",
        actions: ["setValue"],
      }),
    ]),
  );

  expect(
    await callTool(page, "act", {
      steps: [{ ref: "When Rodeo checks", action: "setValue", args: ["push"] }],
    }),
  ).toMatchObject({ ok: true });
  await expect(page.getByRole("tab", { name: "Every push" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("Unused export: formatPrice")).toBeVisible();
});

test("a browser without WebMCP never downloads the agent bridge", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(new URL(request.url()).pathname));
  await page.goto("/");
  await page.getByRole("tab", { name: "Every push" }).click();
  await expect(page.getByText("Unused export: formatPrice")).toBeVisible();

  expect(requested.filter((path) => path.includes("agent-bridge"))).toEqual([]);
});
