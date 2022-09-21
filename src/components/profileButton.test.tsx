import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import { TestAuth } from "../testing/auth";
import { TestProfile } from "../testing/profile";
import { ProfileButton } from "./profileButton";

it("invisible withot a profile", () => {
  render(<ProfileButton />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("profile menu opens", async () => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <TestAuth>
        <ProfileButton />
      </TestAuth>
    </Router>
  );

  expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
  fireEvent.click(screen.getByAltText(TestProfile.name));
  screen.getByText("Sign out");

  // TODO(#32): Ideally would test the 'close' case, but I can't figure out how
  // to properly close the Popover in the test.
});

it("profile shows image", async () => {
  render(
    <TestAuth>
      <ProfileButton />
    </TestAuth>
  );
  const avatar = screen.getByAltText(TestProfile.name);
  expect(avatar).toHaveAttribute("src", TestProfile.imageUrl);
});

it("profile without image shows first initial", async () => {
  render(
    <TestAuth profile={{ ...TestProfile, imageUrl: "" }}>
      <ProfileButton />
    </TestAuth>
  );
  screen.getByRole("button", { name: TestProfile.name.charAt(0) });
});
