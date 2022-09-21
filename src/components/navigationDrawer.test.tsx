import { render, screen, within } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { SnackbarProvider } from "notistack";
import { Router } from "react-router-dom";
import { TestAuth } from "../testing/auth";
import { TestRegistration } from "../testing/registration";
import { NavigationDrawer } from "./navigationDrawer";
import { RegistrationState } from "./registration";

type TestType = [string, string];

describe("navigation drawer", () => {
  it.each<TestType>([
    ["", "Home"],
    ["/workspaces", "Workspaces"],
    ["/workspaces/id", "Workspaces"],
    ["/datasets", "Explore data"],
  ])("%s shows %s selected", async (path: string, item: string) => {
    const history = createMemoryHistory({ initialEntries: [path] });
    render(
      <SnackbarProvider>
        <Router history={history}>
          <TestAuth>
            <TestRegistration>
              <NavigationDrawer />
            </TestRegistration>
          </TestAuth>
        </Router>
      </SnackbarProvider>
    );
    within(screen.getByRole("link", { name: item })).getByTestId("selected");
    ["Home", "Workspaces", "Explore data"]
      .filter((n) => n !== item)
      .forEach((n) => {
        const link = screen.getByRole("link", { name: n });
        expect(within(link).queryByTestId("selected")).not.toBeInTheDocument();
      });
  });

  it("is hidden when not logged in", () => {
    render(
      <SnackbarProvider>
        <Router history={createMemoryHistory()}>
          <TestAuth noProfile>
            <TestRegistration>
              <NavigationDrawer />
            </TestRegistration>
          </TestAuth>
        </Router>
      </SnackbarProvider>
    );
    expect(
      screen.queryByRole("link", { name: "Home" })
    ).not.toBeInTheDocument();
  });

  it("is hidden when not registered", () => {
    render(
      <SnackbarProvider>
        <Router history={createMemoryHistory()}>
          <TestAuth>
            <TestRegistration registration={RegistrationState.Unregistered}>
              <NavigationDrawer />
            </TestRegistration>
          </TestAuth>
        </Router>
      </SnackbarProvider>
    );
    expect(
      screen.queryByRole("link", { name: "Home" })
    ).not.toBeInTheDocument();
  });
});
