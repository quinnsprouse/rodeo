import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { expect } from "./fixtures";

export async function structuredData(page: Page): Promise<unknown> {
  return JSON.parse(String(await page.locator('script[type="application/ld+json"]').textContent()));
}

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function axeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  return results.violations.map(({ id, help, nodes }) => ({
    id,
    help,
    targets: nodes.map((node) => node.target.join(" ")),
  }));
}

export function pageColors(page: Page) {
  return page.evaluate(() => {
    const painter = new OffscreenCanvas(1, 1).getContext("2d", { willReadFrequently: true });
    function painted(color: string) {
      if (!painter || !CSS.supports("color", color)) return `not a color: ${color}`;
      painter.clearRect(0, 0, 1, 1);
      painter.fillStyle = color;
      painter.fillRect(0, 0, 1, 1);
      return painter.getImageData(0, 0, 1, 1).data.join(",");
    }
    const themeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute("content");
    return {
      chrome: painted(themeColor ?? ""),
      background: painted(getComputedStyle(document.body).backgroundColor),
    };
  });
}

export async function chromePaintedBackground(page: Page) {
  await expect
    .poll(
      async () => {
        const { chrome, background } = await pageColors(page);
        return chrome === background;
      },
      { message: "theme-color paints the body background" },
    )
    .toBe(true);
  return (await pageColors(page)).background;
}

export function brightness(color: string) {
  return color
    .split(",")
    .slice(0, 3)
    .reduce((sum, channel) => sum + Number(channel), 0);
}
