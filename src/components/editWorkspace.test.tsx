import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import { IamRole, WorkspaceDescription } from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { useWorkspace } from "./api/workspace";
import { EditWorkspaceButton } from "./editWorkspace";

function TestWorkspace({
  workspaceUserFacingId,
  onUpdate,
}: {
  workspaceUserFacingId: string;
  onUpdate: (workspace: WorkspaceDescription | undefined) => void;
}) {
  const { data } = useWorkspace(workspaceUserFacingId);
  onUpdate(data);
  return <div />;
}

describe("edit workspace", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { workspaceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onWorkspaceUpdate = jest.fn();
    render(
      <Router history={createMemoryHistory()}>
        <FakeApiProvider apis={apis}>
          <TestWorkspace
            workspaceUserFacingId="test-ufid"
            onUpdate={onWorkspaceUpdate}
          />
          <EditWorkspaceButton workspace={workspace} iamRole={IamRole.Writer} />
        </FakeApiProvider>
      </Router>
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await screen.findByRole("heading", { name: "Edit workspace" });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "edited display name" },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "ID" }), {
      target: { value: "edited-id" },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "edited description" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Edit workspace" })
    );

    const expected = expect.objectContaining({
      id: workspace.id,
      userFacingId: "edited-id",
      displayName: "edited display name",
      description: "edited description",
      gcpContext: { projectId: workspace.gcpContext?.projectId },
    });
    expect((await workspaceApi.listWorkspaces()).workspaces).toEqual([
      expected,
    ]);
  });

  it("is successful with unedited ID", async () => {
    // Identical to "is successful" test, but keep the ID unchanged.
    const apis = apiFakes();
    const { workspaceApi } = apis;
    const workspace = await createTestWorkspace(apis, {
      userFacingId: "test-ufid-existing",
      id: "test-id-existing",
    });

    const onWorkspaceUpdate = jest.fn();
    render(
      <Router history={createMemoryHistory()}>
        <FakeApiProvider apis={apis}>
          <TestWorkspace
            workspaceUserFacingId="test-ufid-existing"
            onUpdate={onWorkspaceUpdate}
          />
          <EditWorkspaceButton workspace={workspace} iamRole={IamRole.Writer} />
        </FakeApiProvider>
      </Router>
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await screen.findByRole("heading", { name: "Edit workspace" });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "edited display name" },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "edited description" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Edit workspace" })
    );

    const expected = expect.objectContaining({
      id: workspace.id,
      userFacingId: "test-ufid-existing",
      displayName: "edited display name",
      description: "edited description",
      gcpContext: { projectId: workspace.gcpContext?.projectId },
    });
    expect(onWorkspaceUpdate).toHaveBeenLastCalledWith(expected);
    expect((await workspaceApi.listWorkspaces()).workspaces).toEqual([
      expected,
    ]);
  });

  it("is disabled", async () => {
    const workspace: WorkspaceDescription = {
      id: "test-id",
      userFacingId: "test-ufid",
      highestRole: IamRole.Owner,
    };
    render(
      <EditWorkspaceButton workspace={workspace} iamRole={IamRole.Reader} />
    );
    screen.getByLabelText("You must be an Owner or Writer to edit a workspace");
  });
});
