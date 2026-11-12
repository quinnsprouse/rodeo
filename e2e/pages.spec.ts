import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

import { appOrigin } from "./environment";
import { expect, test } from "./fixtures";
import { axeViolations, pageColors, pageRoutes, structuredData, type PageRoute } from "./helpers";

async function sitemapPaths(request: APIRequestContext) {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const locations = sitemap.match(/(?<=<loc>)[^<]+(?=<\/loc>)/g) ?? [];
  return locations.map((location) => new URL(location).pathname);
}

type PageCheck = (page: Page, route: PageRoute) => Promise<void>;

async function checkPage(
  context: BrowserContext,
  route: PageRoute,
  check: PageCheck,
  search: string,
) {
  const page = await context.newPage();
  const response = await page.goto(`${route.path}${search}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
  await check(page, route);
  await page.close();
}

async function checkEveryPage(context: BrowserContext, check: PageCheck, { search = "" } = {}) {
  const routes = await pageRoutes(context);
  const outcomes = await Promise.allSettled(
    routes.map((route) => test.step(route.path, () => checkPage(context, route, check, search))),
  );
  const failedPaths = routes
    .filter((_, index) => outcomes[index]?.status === "rejected")
    .map(({ path }) => path);
  const firstFailure = outcomes.find(
    (outcome): outcome is PromiseRejectedResult => outcome.status === "rejected",
  );
  if (firstFailure) {
    throw new Error(`Failed on ${failedPaths.join(", ")}`, { cause: firstFailure.reason });
  }
}

test("every page renders one main landmark that the skip link reaches", async ({ context }) => {
  await checkEveryPage(context, async (page) => {
    await expect(page.getByRole("main")).toHaveCount(1);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main:target")).toBeVisible();
  });
});

test.describe(() => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

  test("every page fits a 390px screen once its motion settles", async ({ context }) => {
    await checkEveryPage(context, async (page) => {
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

    test("every page has no WCAG violations", async ({ context }) => {
      await checkEveryPage(context, async (page) => {
        expect(await axeViolations(page)).toEqual([]);
      });
    });

    test("every page paints the browser chrome with its background", async ({ context }) => {
      await checkEveryPage(context, async (page) => {
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
}) => {
  await checkEveryPage(
    context,
    async (page, { path }) => {
      const canonical = new URL(path, appOrigin).href;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    },
    { search: "?utm_source=newsletter" },
  );
});

test("every page's structured data parses and names the page's canonical URL", async ({
  context,
}) => {
  const described: string[] = [];
  await checkEveryPage(context, async (page, { path }) => {
    const canonical = JSON.stringify(new URL(path, appOrigin).href);
    for (const data of await structuredData(page)) {
      expect(JSON.stringify(data)).toContain(canonical);
      described.push(path);
    }
  });
  expect(described, "The home page describes the site").toContain("/");
});

test("every page offers a Markdown version, and llms.txt lists the listed ones", async ({
  context,
  request,
}) => {
  const llms = await (await request.get("/llms.txt")).text();
  await checkEveryPage(context, async (page, { path, listed }) => {
    const alternate = page.locator('link[rel="alternate"][type="text/markdown"]');
    await expect(alternate).toHaveCount(1);
    const markdownUrl = new URL(String(await alternate.getAttribute("href")));

    expect(markdownUrl.origin).toBe(appOrigin);
    const markdown = await request.get(markdownUrl.pathname);
    await expect(markdown).toBeOK();
    expect(markdown.headers()["content-type"]).toContain("text/markdown");
    expect(llms.includes(`(${markdownUrl.href})`), "llms.txt lists the page if it is listed").toBe(
      listed,
    );

    const text = await markdown.text();
    const heading = await page.getByRole("heading", { level: 1 }).textContent();
    expect(text.split("\n")[0], "The Markdown starts with the page's heading").toBe(`# ${heading}`);
    const negotiated = await request.get(path, { headers: { accept: "text/markdown" } });
    expect(await negotiated.text(), "Asking the page for Markdown serves the same text").toBe(text);
  });
});

test("the sitemap lists exactly the listed pages", async ({ context, request }) => {
  const listedPaths = (await pageRoutes(context))
    .filter(({ listed }) => listed)
    .map(({ path }) => path);
  expect((await sitemapPaths(request)).toSorted()).toEqual(listedPaths.toSorted());
});

test("every page shares an image of the size it declares", async ({ context, request }) => {
  await checkEveryPage(context, async (page) => {
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
