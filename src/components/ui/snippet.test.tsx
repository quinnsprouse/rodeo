import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { Snippet } from "./snippet";

describe("Snippet", () => {
  it("renders the command text", () => {
    render(<Snippet text="npm install" />);
    expect(screen.getByText("npm install")).toBeInTheDocument();
  });

  it("renders multiple lines", () => {
    render(<Snippet text={["line one", "line two"]} />);
    expect(screen.getByText("line one")).toBeInTheDocument();
    expect(screen.getByText("line two")).toBeInTheDocument();
  });

  it("has a copy button", async () => {
    const user = userEvent.setup();
    render(<Snippet text="npm install" />);

    const button = screen.getByRole("button", { name: /copy/i });
    expect(button).toBeInTheDocument();
    // Click should not throw even without clipboard API
    await user.click(button);
  });

  it("copies text to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<Snippet text="npm install" />);

    await user.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith("npm install");
    expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
  });
});
