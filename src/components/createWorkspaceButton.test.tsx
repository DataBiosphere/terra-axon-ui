import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import { apiFakes } from "../testing/api/fakes";
import { FakeApiProvider } from "../testing/api/provider";
import { CreateWorkspaceButton } from "./createWorkspaceButton";

describe("create workspace", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { workspaceApi } = apis;

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <FakeApiProvider apis={apis}>
          <CreateWorkspaceButton />
        </FakeApiProvider>
      </Router>
    );

    fireEvent.click(screen.getByRole("button", { name: "New workspace" }));
    screen.getByRole("heading", { name: "Create a new workspace" });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test name" },
    });
    const next = screen.getByRole("button", { name: "Next" });
    await waitFor(() => expect(next).toBeEnabled());
    fireEvent.click(next);

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Create a new workspace" })
    );
    expect(history.location.pathname).toMatch(/\/workspaces\/(.+)/);

    expect((await workspaceApi.listWorkspaces()).workspaces).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        displayName: "test name",
        description: "test description",
        spendProfile: "wm-default-spend-profile",
        stage: "MC_WORKSPACE",
        gcpContext: { projectId: expect.any(String) },
      }),
    ]);
  });
});
