import { render, screen } from "@testing-library/react";
import { GitRepoLink } from "./gitRepoLink";

describe("git repo link", () => {
  describe("renders", () => {
    it.each<[string, string, string]>([
      ["plaintext (not a link)", "plaintext here", "plaintext here"],
      [
        "regular github link",
        "https://github.com/test-repo-path/test-repo-name",
        "https://github.com/test-repo-path/test-repo-name",
      ],
      [
        "ssh github link (no prefix)",
        "ssh://git@github.com/test-repo-path/test-repo-name.git",
        "ssh://git@github.com/test-repo-path/test-repo-name.git",
      ],
      [
        "ssh github link (with ssh:// prefix)",
        "git@github.com:test-repo-path/test-repo-name.git",
        "git@github.com:test-repo-path/test-repo-name.git",
      ],
      [
        "github link with trailing whitespace",
        "https://github.com/test-repo-path/test-repo-name         ",
        "https://github.com/test-repo-path/test-repo-name",
      ],
    ])(`%s renders`, (urlType: string, url: string, expected: string) => {
      const TestGitRepoLink = <GitRepoLink url={url} />;
      render(TestGitRepoLink);
      screen.getByText(`${expected}`);
    });
  });

  describe("plaintext", () => {
    const url = "plaintext (not a supported git link)";
    const TestGitRepoLink = <GitRepoLink url={url} />;
    it("does not link", () => {
      render(TestGitRepoLink);
      expect(screen.getByText(`${url}`)).not.toHaveAttribute("href");
    });
  });

  describe("link is successful", () => {
    it.each<[string, string, string, string]>([
      [
        "regular github link",
        "https://github.com/test-repo-path/test-repo-name",
        "https://github.com/test-repo-path/test-repo-name",
        "https://github.com/test-repo-path/test-repo-name",
      ],
      [
        "ssh github link (no prefix)",
        "ssh://git@github.com/test-repo-path/test-repo-name.git",
        "ssh://git@github.com/test-repo-path/test-repo-name.git",
        "https://github.com/test-repo-path/test-repo-name.git",
      ],
      [
        "ssh github link (with ssh:// prefix)",
        "git@github.com:test-repo-path/test-repo-name.git",
        "git@github.com:test-repo-path/test-repo-name.git",
        "https://github.com/test-repo-path/test-repo-name.git",
      ],
      [
        "github link with trailing whitespace",
        "https://github.com/test-repo-path/test-repo-name         ",
        "https://github.com/test-repo-path/test-repo-name",
        "https://github.com/test-repo-path/test-repo-name",
      ],
    ])(
      `%s is successful`,
      (
        urlType: string,
        url: string,
        expectedDisplay: string,
        expectedLink: string
      ) => {
        const TestGitRepoLink = <GitRepoLink url={url} />;
        render(TestGitRepoLink);
        expect(screen.getByText(`${expectedDisplay}`)).toHaveAttribute(
          "href",
          expectedLink
        );
      }
    );
  });
});
