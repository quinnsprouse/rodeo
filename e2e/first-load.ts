import type { Browser, Page, Request } from "@playwright/test";

import { expect } from "./fixtures";

const assetKinds = [
  { kind: "JavaScript", contentType: "javascript", resourceType: "script" },
  { kind: "CSS", contentType: "text/css", resourceType: "stylesheet" },
];
const quietMilliseconds = 500;

function watchAssetRequests(page: Page, appOrigin: string) {
  function isAppAsset(request: Request) {
    return (
      new URL(request.url()).origin === appOrigin &&
      assetKinds.some(({ resourceType }) => resourceType === request.resourceType())
    );
  }
  const inFlight = new Set<Request>();
  const finished: Request[] = [];
  const quiet = { since: Date.now() };
  page.on("request", (request) => {
    if (!isAppAsset(request)) return;
    inFlight.add(request);
    quiet.since = Date.now();
  });
  page.on("requestfinished", (request) => {
    finished.push(request);
    if (inFlight.delete(request)) quiet.since = Date.now();
  });
  page.on("requestfailed", (request) => inFlight.delete(request));
  return {
    finished,
    restartQuiet: () => {
      quiet.since = Date.now();
    },
    isQuiet: () => inFlight.size === 0 && Date.now() - quiet.since >= quietMilliseconds,
  };
}

function mainThreadGoesIdle() {
  return new Promise<boolean>((resolve) => {
    requestIdleCallback((deadline) => resolve(!deadline.didTimeout), { timeout: 5000 });
  });
}

async function download(request: Request) {
  const response = await request.response();
  const contentType = response?.headers()["content-type"] ?? "";
  const kind = assetKinds.find((asset) => contentType.includes(asset.contentType))?.kind;
  if (!kind) return undefined;
  const { responseBodySize } = await request.sizes();
  return { kind, file: new URL(request.url()).pathname, bytes: responseBodySize };
}

export async function firstLoadDownloads(browser: Browser, url: string) {
  const firstVisit = await browser.newContext();
  try {
    const page = await firstVisit.newPage();
    const appOrigin = new URL(url).origin;
    const requests = watchAssetRequests(page, appOrigin);
    const document = await page.goto(url);
    expect(document?.status(), `${url} renders`).toBe(200);
    expect(
      await page.evaluate(mainThreadGoesIdle),
      `${url} lets its main thread go idle within 5 seconds of loading`,
    ).toBe(true);
    requests.restartQuiet();
    await expect
      .poll(async () => (await page.evaluate(mainThreadGoesIdle)) && requests.isQuiet(), {
        message: `${url} stops downloading its JavaScript and CSS`,
      })
      .toBe(true);

    const fromTheApp = requests.finished.filter(
      (request) => new URL(request.url()).origin === appOrigin,
    );
    const downloads = await Promise.all(fromTheApp.map(download));
    // why: Playwright reports a negative body size for a response the browser's cache answered,
    // which would subtract from the total.
    return downloads.filter((asset) => asset !== undefined).filter(({ bytes }) => bytes > 0);
  } finally {
    await firstVisit.close();
  }
}
