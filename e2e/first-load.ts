import type { Browser, Response } from "@playwright/test";

import { expect } from "./fixtures";

const assetKinds = [
  { kind: "JavaScript", contentType: "javascript" },
  { kind: "CSS", contentType: "text/css" },
];

async function download(response: Response) {
  const contentType = response.headers()["content-type"] ?? "";
  const kind = assetKinds.find((asset) => contentType.includes(asset.contentType))?.kind;
  const failure = await response.finished();
  if (!kind || failure) return undefined;
  const { responseBodySize } = await response.request().sizes();
  return { kind, file: new URL(response.url()).pathname, bytes: responseBodySize };
}

export async function firstLoadDownloads(browser: Browser, url: string) {
  const firstVisit = await browser.newContext();
  const page = await firstVisit.newPage();
  const responses: Response[] = [];
  page.on("response", (response) => responses.push(response));
  const document = await page.goto(url, { waitUntil: "networkidle" });
  expect(document?.status(), `${url} renders`).toBe(200);
  const fromTheApp = responses.filter(
    (response) => new URL(response.url()).origin === new URL(url).origin,
  );
  const downloads = await Promise.all(fromTheApp.map(download));
  await firstVisit.close();
  return downloads.filter((asset) => asset !== undefined);
}
