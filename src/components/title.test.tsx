import { renderHook } from "@testing-library/react-hooks";
import { useTitlePrefix } from "./title";

test("set and unset page title", () => {
  const base = "base title";
  const prefix = "page title";

  document.title = base;
  const { unmount } = renderHook(() => useTitlePrefix(prefix));
  expect(document.title).toBe(prefix + " - " + base);

  unmount();
  expect(document.title).toBe(base);
});
