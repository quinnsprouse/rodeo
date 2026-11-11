import type { Locator, Page } from "@playwright/test";

type Snippet = ReturnType<typeof snippetAround>;

const copyFailed = "Couldn't copy. Select and copy the command manually.";

export function snippetAround(status: Locator) {
  const root = status.locator("..");
  return { root, status, command: root.getByRole("code"), copy: root.getByRole("button") };
}

function copiedThroughSelection(command: string) {
  return {
    screenReader: ['- button "Copied"', "- status: Copied to clipboard."],
    shownMessage: null,
    shownIcons: { copy: false, tick: true },
    copied: command,
    selected: "",
  };
}

function leftForManualCopy(command: string) {
  return {
    screenReader: ['- button "Copy to clipboard"', `- status: ${copyFailed}`],
    shownMessage: copyFailed,
    shownIcons: { copy: true, tick: false },
    copied: null,
    selected: command,
  };
}

export const copyFallbacks = [
  {
    title: "copies through the selection when the browser has no clipboard API",
    breakClipboard: () => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    },
    outcome: copiedThroughSelection,
  },
  {
    title: "copies through the selection when clipboard access is denied",
    breakClipboard: () => {
      Object.defineProperty(navigator.clipboard, "writeText", {
        configurable: true,
        value: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
      });
    },
    outcome: copiedThroughSelection,
  },
  {
    title: "selects the command and explains the manual path when no copy method works",
    breakClipboard: () => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
      Object.defineProperty(document, "execCommand", { configurable: true, value: () => false });
    },
    outcome: leftForManualCopy,
  },
];

export async function withCopyFallback(
  page: Page,
  { breakClipboard }: { breakClipboard: () => void },
) {
  await page.addInitScript(breakClipboard);
  await page.addInitScript(() => {
    document.addEventListener("copy", () => {
      document.documentElement.dataset.copied = String(window.getSelection());
    });
  });
}

async function shownText(locator: Locator) {
  const box = await locator.boundingBox();
  return box && box.width > 1 && box.height > 1 ? locator.textContent() : null;
}

export async function copyState({ root, status, copy }: Snippet) {
  const [copyIcon, tickIcon] = await copy
    .locator("svg")
    .evaluateAll((icons) => icons.map((icon) => getComputedStyle(icon).opacity === "1"));
  return {
    screenReader: [await copy.ariaSnapshot(), await status.ariaSnapshot()],
    shownMessage: await shownText(status),
    shownIcons: { copy: copyIcon, tick: tickIcon },
    copied: await root.page().locator("html").getAttribute("data-copied"),
    selected: await root.page().evaluate(() => String(window.getSelection())),
  };
}
