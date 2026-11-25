import type { Page } from "@playwright/test";

import { expect } from "./fixtures";

type BrowserTool = { name: string; execute: (input: object) => unknown };

declare global {
  interface Document {
    modelContext?: {
      tools: Map<string, BrowserTool>;
      registerTool: (tool: BrowserTool) => Promise<void>;
    };
  }
}

export async function offerWebMcp(page: Page) {
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

export async function openWithWebMcp(page: Page, path: string) {
  await offerWebMcp(page);
  await page.goto(path);
  await expect
    .poll(() => page.evaluate(() => [...(document.modelContext?.tools.keys() ?? [])].toSorted()))
    .toEqual(["act", "query", "snapshot"]);
}

export function callTool(page: Page, name: string, input: object) {
  return page.evaluate(
    ([toolName, toolInput]) => document.modelContext?.tools.get(toolName)?.execute(toolInput),
    [name, input] as const,
  );
}
