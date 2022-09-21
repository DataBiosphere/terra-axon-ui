import { render, screen } from "@testing-library/react";
import { SnackbarProvider } from "notistack";
import { MemoryRouter } from "react-router";
import { CreateWorkspaceRequest } from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { FakeApiProvider } from "../testing/api/provider";
import WorkspacesPage from "./workspaces";

jest.mock("../components/createWorkspaceButton", () => ({
  CreateWorkspaceButton: function createWorkspaceButton() {
    return <div />;
  },
}));

describe("workspace page", () => {
  it("renders workspaces", async () => {
    const workspaces: CreateWorkspaceRequest[] = [
      {
        createWorkspaceRequestBody: {
          id: "id1",
          userFacingId: "ufid1",
          displayName: "workspace 1",
        },
      },
      {
        createWorkspaceRequestBody: {
          id: "id2",
          userFacingId: "ufid2",
          displayName: "workspace 2",
        },
      },
    ];

    const apis = apiFakes();
    const { workspaceApi } = apis;

    workspaces.forEach(async (ws) => await workspaceApi.createWorkspace(ws));

    render(
      <SnackbarProvider>
        <MemoryRouter>
          <FakeApiProvider apis={apis}>
            <WorkspacesPage />
          </FakeApiProvider>
        </MemoryRouter>
      </SnackbarProvider>
    );
    await screen.findByText("Workspaces");

    expect(document.title).toMatch(/^Workspaces/);

    expect(screen.getByRole("link", { name: "workspace 1" })).toHaveAttribute(
      "href",
      "/workspaces/" + workspaces[0].createWorkspaceRequestBody.userFacingId
    );

    expect(screen.getByRole("link", { name: "workspace 2" })).toHaveAttribute(
      "href",
      "/workspaces/" + workspaces[1].createWorkspaceRequestBody.userFacingId
    );
  });

  it("renders empty", async () => {
    render(
      <MemoryRouter>
        <FakeApiProvider>
          <WorkspacesPage />
        </FakeApiProvider>
      </MemoryRouter>
    );
    await screen.findByText("Workspaces");

    expect(document.title).toMatch(/^Workspaces/);
    screen.getByText("No workspaces yet");
  });
});
