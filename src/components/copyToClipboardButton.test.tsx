import { fireEvent, render, screen } from "@testing-library/react";
import { SnackbarProvider } from "notistack";
import {
  CopyToClipboardButton,
  CopyToClipboardProps,
} from "./copyToClipboardButton";

let oldClipboard: unknown;
beforeEach(() => {
  oldClipboard = navigator.clipboard;
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn(() => Promise.resolve()) },
  });
});
afterEach(() => Object.assign(navigator, { clipboard: oldClipboard }));

describe("copy to clipboard button", () => {
  type VariantType = CopyToClipboardProps["variant"];
  it.each<[VariantType, string]>([["text", "Copy"]])(
    "copies as %s",
    async (variant: VariantType, match: string) => {
      const value = "test value to copy";
      render(
        <SnackbarProvider>
          <CopyToClipboardButton variant={variant} value={value} />
        </SnackbarProvider>
      );
      fireEvent.click(screen.getByText(match));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(value);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Copied to clipboard"
      );
    }
  );

  it("displays a copy failure", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() =>
          Promise.reject(new Error("test copy failure"))
        ),
      },
    });

    const value = "test value to copy";
    render(
      <SnackbarProvider>
        <CopyToClipboardButton value={value} />
      </SnackbarProvider>
    );
    fireEvent.click(screen.getByText("content_copy"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to copy to clipboard: test copy failure"
    );
  });
});
