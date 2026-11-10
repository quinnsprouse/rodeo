import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

import { appOrigin } from "./environment";
import { expect, test } from "./fixtures";
import { axeViolations } from "./helpers";

async function sitemapPaths(request: APIRequestContext) {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const locations = sitemap.match(/(?<=<loc>)[^<]+(?=<\/loc>)/g) ?? [];
  const paths = locations.map((location) => new URL(location).pathname);
  expect(paths, "The sitemap lists the home page").toContain("/");
  return paths;
}

type PageCheck = (page: Page, path: string) => Promise<void>;

async function checkPage(context: BrowserContext, path: string, check: PageCheck) {
  const page = await context.newPage();
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
  await check(page, path);
  await page.close();
}

async function checkEveryPage(
  context: BrowserContext,
  request: APIRequestContext,
  check: PageCheck,
) {
  const paths = await sitemapPaths(request);
  const outcomes = await Promise.allSettled(
    paths.map((path) => test.step(path, () => checkPage(context, path, check))),
  );
  const failedPaths = paths.filter((_, index) => outcomes[index]?.status === "rejected");
  const firstFailure = outcomes.find(
    (outcome): outcome is PromiseRejectedResult => outcome.status === "rejected",
  );
  if (firstFailure) {
    throw new Error(`Failed on ${failedPaths.join(", ")}`, { cause: firstFailure.reason });
  }
}

function browserColors(page: Page) {
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

test("every page renders one main landmark that the skip link reaches", async ({
  context,
  request,
}) => {
  await checkEveryPage(context, request, async (page) => {
    await expect(page.getByRole("main")).toHaveCount(1);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main:target")).toBeVisible();
  });
});

test.describe(() => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

  test("every page fits a 390px screen once its motion settles", async ({ context, request }) => {
    await checkEveryPage(context, request, async (page) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, "The page scrolls sideways").toBeLessThanOrEqual(clientWidth);
    });
  });
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`in the ${colorScheme} scheme`, () => {
    // why: Axe samples colors mid-animation, so reduced motion renders the settled page.
    test.use({ colorScheme, reducedMotion: "reduce" });

    test("every page has no WCAG violations", async ({ context, request }) => {
      await checkEveryPage(context, request, async (page) => {
        expect(await axeViolations(page)).toEqual([]);
      });
    });

    test("every page paints the browser chrome with its background", async ({
      context,
      request,
    }) => {
      await checkEveryPage(context, request, async (page) => {
        const { background } = await browserColors(page);
        await expect
          .poll(async () => (await browserColors(page)).chrome, {
            message: "theme-color paints the body background",
          })
          .toBe(background);
      });
    });
  });
}

test("every page names its canonical URL from the configured origin", async ({
  context,
  request,
}) => {
  await checkEveryPage(context, request, async (page, path) => {
    const canonical = new URL(path, appOrigin).href;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
  });
});

test("every page offers a Markdown version that llms.txt lists", async ({ context, request }) => {
  const llms = await (await request.get("/llms.txt")).text();
  await checkEveryPage(context, request, async (page) => {
    const alternate = page.locator('link[rel="alternate"][type="text/markdown"]');
    await expect(alternate).toHaveCount(1);
    const markdownUrl = new URL(String(await alternate.getAttribute("href")));

    expect(markdownUrl.origin).toBe(appOrigin);
    const markdown = await request.get(markdownUrl.pathname);
    await expect(markdown).toBeOK();
    expect(markdown.headers()["content-type"]).toContain("text/markdown");
    expect(llms).toContain(`(${markdownUrl.href})`);
  });
});

test("every page shares an image of the size it declares", async ({ context, request }) => {
  await checkEveryPage(context, request, async (page) => {
    const imageUrl = new URL(
      String(await page.locator('meta[property="og:image"]').getAttribute("content")),
    );

    expect(imageUrl.origin).toBe(appOrigin);
    const image = await request.get(imageUrl.pathname);
    await expect(image).toBeOK();
    const png = await image.body();
    expect(png.toString("latin1", 12, 16), "The image is a PNG").toBe("IHDR");
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      "content",
      String(png.readUInt32BE(16)),
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      "content",
      String(png.readUInt32BE(20)),
    );
  });
});
