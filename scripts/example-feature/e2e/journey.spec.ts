import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

import type { APIRequestContext, Request } from "@playwright/test";

import { expect, test } from "./fixtures";

const e2eEnv = parseEnv(readFileSync(new URL("../.env.e2e", import.meta.url), "utf8"));
const secret = e2eEnv.JOURNEY_SECRET ?? "";
const signature = createHmac("sha256", secret).update("rider").digest("hex").slice(0, 12);
const signedVisit = `Signed for rider: ${signature}`;
const loadingLabel = "Loading the signed visit";
const desktopChrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function replay(request: APIRequestContext, call: Request, site: string) {
  return request.post(call.url(), {
    headers: { ...call.headers(), "sec-fetch-site": site },
    data: call.postDataBuffer() ?? "",
  });
}

test.use({ userAgent: desktopChrome });

test("the signed visit streams in behind its skeleton", async ({ page }) => {
  await page.goto("/journey", { waitUntil: "commit" });

  await expect(page.getByText(loadingLabel)).toBeAttached();
  await expect(page.getByText(signedVisit)).toBeVisible();
  await expect(page.getByText(loadingLabel)).not.toBeAttached();
});

test("the Markdown twin carries the streamed visit, not its skeleton", async ({ request }) => {
  const markdown = await (await request.get("/journey.md")).text();

  expect(markdown).toContain(signedVisit);
  expect(markdown).not.toContain(loadingLabel);
});

test("the server function signs with the secret and refuses other sites", async ({
  page,
  request,
}) => {
  await page.goto("/journey");
  await expect(page.getByText(signedVisit)).toBeVisible();
  const signing = page.waitForRequest((sent) => sent.url().includes("/_serverFn/"));
  await page.getByRole("button", { name: "Sign again" }).click();
  const call = await signing;

  expect((await replay(request, call, "cross-site")).status()).toBe(403);
  const sameOrigin = await replay(request, call, "same-origin");
  expect(sameOrigin.status()).toBe(200);
  expect(await sameOrigin.text()).toContain(signature);
});
