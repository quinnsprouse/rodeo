import { expect, test } from "@playwright/test";

test("responses carry the baseline security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
});

test("the trailing-slash redirect never leaves the site", async ({ baseURL, request }) => {
  const response = await request.get(`${baseURL}//evil.example/`, { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/evil.example");
});

test("server functions reject cross-site requests", async ({ request }) => {
  const serverFn = "/_serverFn/csrf-probe";

  const crossSite = await request.post(serverFn, { headers: { "sec-fetch-site": "cross-site" } });
  expect(crossSite.status()).toBe(403);

  const sameOrigin = await request.post(serverFn, { headers: { "sec-fetch-site": "same-origin" } });
  expect(sameOrigin.status()).not.toBe(403);
});
