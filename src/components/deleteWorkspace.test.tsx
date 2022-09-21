import { Button } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { SnackbarProvider } from "notistack";
import { Router } from "react-router-dom";
import { IamRole, WorkspaceDescription } from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { DeleteWorkspaceMenuItem, useDeleteWorkspace } from "./deleteWorkspace";

const TestDeleteButton = ({
  workspace,
}: {
  workspace: WorkspaceDescription;
}) => {
  const { run } = useDeleteWorkspace(workspace);
  return <Button onClick={run} />;
};

it("workspace deleted", async () => {
  const apis = apiFakes();
  const { workspaceApi } = apis;
  const workspace = await createTestWorkspace(apis, {
    id: "id-to-delete",
  });

  const history = createMemoryHistory();
  render(
    <SnackbarProvider>
      <Router history={history}>
        <FakeApiProvider apis={apis}>
          <TestDeleteButton workspace={workspace} />
        </FakeApiProvider>
      </Router>
    </SnackbarProvider>
  );

  fireEvent.click(screen.getByRole("button"));

  await waitFor(() =>
    expect(history.location.pathname).toStrictEqual("/workspaces")
  );

  expect((await workspaceApi.listWorkspaces()).workspaces).toEqual([]);
});

it("workspace failed to delete", async () => {
  const workspace: WorkspaceDescription = {
    id: "id-to-delete",
    userFacingId: "ufid-to-delete",
    highestRole: IamRole.Owner,
  };

  render(
    <SnackbarProvider>
      <Router history={createMemoryHistory()}>
        <FakeApiProvider>
          <TestDeleteButton workspace={workspace} />
        </FakeApiProvider>
      </Router>
    </SnackbarProvider>
  );

  fireEvent.click(screen.getByRole("button"));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "workspace with id id-to-delete not found"
  );
});

it("is disabled", async () => {
  const workspace: WorkspaceDescription = {
    id: "test-id",
    userFacingId: "test-ufid",
    highestRole: IamRole.Writer,
  };
  render(<DeleteWorkspaceMenuItem workspace={workspace} />);
  screen.getByLabelText("You must be an Owner to delete a workspace");
});
