import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";

export { expect };

// why: Chromium logs a console error for every 404 response, including the page's own document.
export const notFoundResponse = /the server responded with a status of 404/;

function located(page: Page | null, text: string) {
  return `${page?.url() ?? "no page"}: ${text}`;
}

function collectBrowserErrors(context: BrowserContext) {
  const errors: string[] = [];
  context.on("weberror", (webError) => {
    errors.push(located(webError.page(), webError.error().message));
  });
  context.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(located(message.page(), message.text()));
    }
  });
  return errors;
}

export const test = base.extend<{ expectedBrowserErrors: RegExp[] }>({
  expectedBrowserErrors: [[], { option: true }],
  context: async ({ context, expectedBrowserErrors }, provide) => {
    const errors = collectBrowserErrors(context);
    await provide(context);
    const unexpected = errors.filter(
      (error) => !expectedBrowserErrors.some((expected) => expected.test(error)),
    );
    expect(unexpected, "The pages threw or logged errors").toEqual([]);
  },
});
