import { AxeBuilder } from "@axe-core/playwright";
import type { BrowserContext, Page } from "@playwright/test";

import { expect } from "./fixtures";

export interface PageRoute {
  path: string;
  listed: boolean;
}

function routesInBrowser() {
  const router: unknown = Reflect.get(window, "__TSR_ROUTER__");
  const routesByPath: unknown =
    typeof router === "object" && router !== null ? Reflect.get(router, "routesByPath") : {};
  const routes = typeof routesByPath === "object" && routesByPath !== null ? routesByPath : {};
  const fieldPaths = [
    ["options", "component"],
    ["options", "staticData", "page", "listed"],
  ];
  return Object.entries(routes).map(([path, route]: [string, unknown]) => {
    const [component, listed] = fieldPaths.map((keys) =>
      keys.reduce<unknown>(
        (value, key) =>
          typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined,
        route,
      ),
    );
    return {
      path,
      isPage: component !== undefined && !path.includes("$"),
      listed: listed !== false,
    };
  });
}

export async function pageRoutes(context: BrowserContext): Promise<PageRoute[]> {
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForFunction(() => Reflect.has(window, "__TSR_ROUTER__"));
  const routes = await page.evaluate(routesInBrowser);
  await page.close();
  const pages = routes.filter(({ isPage }) => isPage).map(({ path, listed }) => ({ path, listed }));
  expect(
    pages.map(({ path }) => path),
    "The router knows the home page",
  ).toContain("/");
  return pages;
}

export async function structuredData(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((block): unknown => JSON.parse(block));
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
