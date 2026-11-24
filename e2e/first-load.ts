import type { Browser, Page, Request } from "@playwright/test";

import { expect } from "./fixtures";

const assetKinds = [
  { kind: "JavaScript", contentType: "javascript", resourceType: "script" },
  { kind: "CSS", contentType: "text/css", resourceType: "stylesheet" },
];
const quietMilliseconds = 500;

function isAssetRequest(request: Request) {
  return assetKinds.some(({ resourceType }) => resourceType === request.resourceType());
}

function watchAssetRequests(page: Page) {
  const inFlight = new Set<Request>();
  const finished: Request[] = [];
  const quiet = { since: Date.now() };
  page.on("request", (request) => {
    if (!isAssetRequest(request)) return;
    inFlight.add(request);
    quiet.since = Date.now();
  });
  page.on("requestfinished", (request) => {
    inFlight.delete(request);
    finished.push(request);
    quiet.since = Date.now();
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

function mainThreadIdle() {
  return new Promise<void>((resolve) => {
    requestIdleCallback(() => resolve());
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
    const requests = watchAssetRequests(page);
    const document = await page.goto(url);
    expect(document?.status(), `${url} renders`).toBe(200);
    await page.evaluate(mainThreadIdle);
    requests.restartQuiet();
    await expect
      .poll(
        async () => {
          await page.evaluate(mainThreadIdle);
          return requests.isQuiet();
        },
        { message: `${url} starts up and stops downloading JavaScript and CSS` },
      )
      .toBe(true);

    const fromTheApp = requests.finished.filter(
      (request) => new URL(request.url()).origin === new URL(url).origin,
    );
    const downloads = await Promise.all(fromTheApp.map(download));
    // why: Playwright reports a negative body size for a response the browser's cache answered,
    // which would subtract from the total.
    return downloads.filter((asset) => asset !== undefined).filter(({ bytes }) => bytes > 0);
  } finally {
    await firstVisit.close();
  }
}
