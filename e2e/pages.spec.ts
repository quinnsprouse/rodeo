import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

import { appOrigin } from "./environment";
import { expect, test } from "./fixtures";
import { axeViolations, pageColors } from "./helpers";

async function sitemapPaths(request: APIRequestContext) {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const locations = sitemap.match(/(?<=<loc>)[^<]+(?=<\/loc>)/g) ?? [];
  const paths = locations.map((location) => new URL(location).pathname);
  expect(paths, "The sitemap lists the home page").toContain("/");
  return paths;
}

type PageCheck = (page: Page, path: string) => Promise<void>;

async function checkPage(context: BrowserContext, path: string, check: PageCheck, search: string) {
  const page = await context.newPage();
  const response = await page.goto(`${path}${search}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
  await check(page, path);
  await page.close();
}

async function checkEveryPage(
  context: BrowserContext,
  request: APIRequestContext,
  check: PageCheck,
  { search = "" } = {},
) {
  const paths = await sitemapPaths(request);
  const outcomes = await Promise.allSettled(
    paths.map((path) => test.step(path, () => checkPage(context, path, check, search))),
  );
  const failedPaths = paths.filter((_, index) => outcomes[index]?.status === "rejected");
  const firstFailure = outcomes.find(
    (outcome): outcome is PromiseRejectedResult => outcome.status === "rejected",
  );
  if (firstFailure) {
    throw new Error(`Failed on ${failedPaths.join(", ")}`, { cause: firstFailure.reason });
  }
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
        const { background } = await pageColors(page);
        await expect
          .poll(async () => (await pageColors(page)).chrome, {
            message: "theme-color paints the body background",
          })
          .toBe(background);
      });
    });
  });
}

test("every page names its canonical URL from the configured origin, without the query", async ({
  context,
  request,
}) => {
  await checkEveryPage(
    context,
    request,
    async (page, path) => {
      const canonical = new URL(path, appOrigin).href;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    },
    { search: "?utm_source=newsletter" },
  );
});

test("every page offers a Markdown version that llms.txt lists", async ({ context, request }) => {
  const llms = await (await request.get("/llms.txt")).text();
  await checkEveryPage(context, request, async (page, path) => {
    const alternate = page.locator('link[rel="alternate"][type="text/markdown"]');
    await expect(alternate).toHaveCount(1);
    const markdownUrl = new URL(String(await alternate.getAttribute("href")));

    expect(markdownUrl.origin).toBe(appOrigin);
    const markdown = await request.get(markdownUrl.pathname);
    await expect(markdown).toBeOK();
    expect(markdown.headers()["content-type"]).toContain("text/markdown");
    expect(llms).toContain(`(${markdownUrl.href})`);

    const text = await markdown.text();
    const heading = await page.getByRole("heading", { level: 1 }).textContent();
    expect(text.split("\n")[0], "The Markdown starts with the page's heading").toBe(`# ${heading}`);
    const negotiated = await request.get(path, { headers: { accept: "text/markdown" } });
    expect(await negotiated.text(), "Asking the page for Markdown serves the same text").toBe(text);
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
