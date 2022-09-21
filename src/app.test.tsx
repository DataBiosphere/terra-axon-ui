import { render, screen } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import App from "./app";
import { RegistrationState, useRegistration } from "./components/registration";
import { TestAuth } from "./testing/auth";
import { TestProfile } from "./testing/profile";

jest.mock("./components/registration");
const mockUseRegistrationCheck = useRegistration as jest.MockedFunction<
  typeof useRegistration
>;
beforeEach(() =>
  mockUseRegistrationCheck.mockReturnValue(RegistrationState.Registered)
);

it("signed out redirects to login screen", () => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <App />
    </Router>
  );
  expect(history.location.pathname).toBe("/login");
  expect(
    screen.getByRole("button", { name: "Sign in with Google" })
  ).toBeInTheDocument();
});

it("signed in renders the Terra home page", () => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <TestAuth>
        <App />
      </TestAuth>
    </Router>
  );
  expect(history.location.pathname).toBe("/");
  expect(screen.getByText(/Welcome to Terra/i)).toBeInTheDocument();
});

it("signed in with bad url renders the Not Found page", () => {
  const history = createMemoryHistory({ initialEntries: ["/some/bad/route"] });
  render(
    <Router history={history}>
      <TestAuth>
        <App />
      </TestAuth>
    </Router>
  );
  expect(history.location.pathname).toBe("/some/bad/route");
  expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
});

it("signed out with bad url redirects to login screen", () => {
  const history = createMemoryHistory({ initialEntries: ["/some/bad/route"] });
  render(
    <Router history={history}>
      <App />
    </Router>
  );
  expect(history.location.pathname).toBe("/login");
  expect(
    screen.getByRole("button", { name: "Sign in with Google" })
  ).toBeInTheDocument();
});

it("login redirects to original url", () => {
  const history = createMemoryHistory({ initialEntries: ["/original/route"] });
  const { rerender } = render(
    <Router history={history}>
      <App />
    </Router>
  );
  expect(history.location.pathname).toBe("/login");
  rerender(
    <Router history={history}>
      <TestAuth>
        <App />
      </TestAuth>
    </Router>
  );
  expect(history.location.pathname).toBe("/original/route");
});

it("expired and loading shows authorizing", () => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <TestAuth expired={true} loaded={false}>
        <App />
      </TestAuth>
    </Router>
  );
  expect(history.location.pathname).toBe("/");
  expect(
    screen.getByText(/Refreshing Authorization\.\.\./i)
  ).toBeInTheDocument();
});

it("expired and loaded shows refresh", () => {
  const history = createMemoryHistory();
  render(
    <Router history={history}>
      <TestAuth expired={true}>
        <App />
      </TestAuth>
    </Router>
  );
  expect(history.location.pathname).toBe("/");
  expect(
    screen.getByText(/Your Google login has expired\./i)
  ).toBeInTheDocument();
});

it("not registered", () => {
  mockUseRegistrationCheck.mockReturnValue(RegistrationState.Unregistered);

  render(
    <Router history={createMemoryHistory()}>
      <TestAuth>
        <App />
      </TestAuth>
    </Router>
  );
  expect(
    screen.getByText(
      "The account " + TestProfile.email + " is not registered",
      { exact: false }
    )
  ).toBeInTheDocument();
});

it("checking registration", () => {
  mockUseRegistrationCheck.mockReturnValue(RegistrationState.Checking);

  render(
    <Router history={createMemoryHistory()}>
      <TestAuth>
        <App />
      </TestAuth>
    </Router>
  );
  expect(screen.getByText(/Checking registration/i)).toBeInTheDocument();
});
