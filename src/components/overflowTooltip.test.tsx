import { fireEvent, render, screen } from "@testing-library/react";
import { OverflowTooltip } from "./overflowTooltip";

function setOverflow(isOverflow: boolean) {
  // if clientWidth < scrollWidth, then the text
  //  is overflowing.
  // if clientWidth >= scrollWidth, then the text
  //  is not overflowing.
  const clientWidth = isOverflow ? 0 : 100;
  const scrollWidth = isOverflow ? 100 : 0;
  return Object.defineProperties(HTMLElement.prototype, {
    clientWidth: {
      configurable: true,
      value: clientWidth,
    },
    scrollWidth: {
      configurable: true,
      value: scrollWidth,
    },
  });
}

// Note: Delay before showing tooltip set to 0 for testing purposes
describe("tooltip", () => {
  it("renders tooltip from title", async () => {
    setOverflow(true);
    render(
      <OverflowTooltip
        enterDelay={0}
        title={"same hover and label text"}
      ></OverflowTooltip>
    );
    fireEvent.mouseOver(screen.getByText("same hover and label text"));
    screen.getByRole("tooltip", { name: "same hover and label text" });
  });
  it("renders tooltip with custom children", async () => {
    setOverflow(true);
    render(
      <OverflowTooltip enterDelay={0} title={"hover text"}>
        mocked long text
      </OverflowTooltip>
    );
    fireEvent.mouseOver(screen.getByText("mocked long text"));
    screen.getByRole("tooltip", { name: "hover text" });
  });
  it("does not render", async () => {
    setOverflow(false);
    render(
      <OverflowTooltip enterDelay={0} title={"hover text"}>
        mocked short text
      </OverflowTooltip>
    );
    fireEvent.mouseOver(screen.getByText("mocked short text"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
