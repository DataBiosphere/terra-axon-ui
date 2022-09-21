import { lastModifiedToString } from "./lastModified";

function rewindTimeFromNow(seconds: number) {
  const now = new Date();
  const result = new Date(now.getTime() - seconds * 1000);
  return result;
}

describe("last modified time", () => {
  it("returns undefined", () => {
    const result = lastModifiedToString(undefined);
    expect(result).toBe(undefined);
  });

  it("returns 'Just now'", () => {
    const now = new Date();
    expect(lastModifiedToString(now)).toBe("Just now");
  });

  it.each<[string, number]>([
    ["1 minute ago", 1 * 60],
    ["59 minutes ago", 59 * 60],
    ["1 hour ago", 1 * (60 * 60)],
    ["23 hours ago", 23 * (60 * 60)],
    ["1 day ago", 1 * (24 * 60 * 60)],
    ["13 days ago", 13 * (24 * 60 * 60)],
  ])(`returns %s`, (expected: string, secondsDifference: number) => {
    const time = rewindTimeFromNow(secondsDifference);
    expect(lastModifiedToString(time)).toBe(expected);
  });
  it("returns the exact date (>= 14 days)", () => {
    const time = new Date("2015-03-14T09:26:53");

    const result = lastModifiedToString(time);
    expect(result).toEqual(expect.stringContaining(","));

    const expectedDate = time.toLocaleString("default", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    expect(result).toBe(expectedDate);
  });
});
