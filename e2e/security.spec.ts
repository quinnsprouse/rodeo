import { expect, test } from "@playwright/test";

test("responses carry the baseline security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
});

test("server functions reject cross-site requests", async ({ page, request }) => {
  await page.goto("/");
  const serverFnCall = page.waitForRequest((call) => call.url().includes("/_serverFn/"));
  await page.getByRole("link", { name: "Preview the error path" }).click();
  const call = await serverFnCall;
  const headers = await call.allHeaders();

  const crossSite = await request.get(call.url(), {
    headers: { ...headers, "sec-fetch-site": "cross-site" },
  });
  expect(crossSite.status()).toBe(403);

  // The same request from the app's origin reaches the function, which fails on purpose.
  const sameOrigin = await request.get(call.url(), {
    headers: { ...headers, "sec-fetch-site": "same-origin" },
  });
  expect(await sameOrigin.text()).toContain("The starter server function failed as requested.");
});
