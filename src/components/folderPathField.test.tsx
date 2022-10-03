import { fireEvent, render, screen } from "@testing-library/react";
import { Form } from "react-final-form";
import { Folder } from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { FolderPathField } from "./folderPathField";
import nop from "./nop";

describe("folder path field validation", () => {
  it("renders selection", async () => {
    const apis = apiFakes();
    const { folderApi } = apis;
    const workspace = await createTestWorkspace(apis, {
      displayName: "test-workspace-name",
    });
    const folderA = await folderApi.createFolder({
      workspaceId: workspace.id,
      createFolderRequestBody: { displayName: "folder A" },
    });
    const folderB = await folderApi.createFolder({
      workspaceId: workspace.id,
      createFolderRequestBody: { displayName: "folder B" },
    });
    const folderA2 = await folderApi.createFolder({
      workspaceId: workspace.id,
      createFolderRequestBody: {
        displayName: "folder A2",
        parentFolderId: folderA.id,
      },
    });
    const folderA1 = await folderApi.createFolder({
      workspaceId: workspace.id,
      createFolderRequestBody: {
        displayName: "folder A1",
        parentFolderId: folderA.id,
      },
    });
    const root: Folder = { id: "", displayName: "[test-workspace-name]" };
    const expected = [root, folderA, folderA1, folderA2, folderB];

    render(
      <FakeApiProvider apis={apis}>
        <Form
          onSubmit={nop}
          render={() => <FolderPathField workspace={workspace} />}
        />
      </FakeApiProvider>
    );

    fireEvent.mouseDown(screen.getByRole("button"));
    await screen.findByRole("option", { name: "folder A" });

    const options = screen.getAllByRole("option");
    expected.forEach((folder, i) => {
      expect(options[i]).toHaveTextContent(folder.displayName);
    });

    fireEvent.click(screen.getByRole("option", { name: "folder A1" }));
    expect(screen.getByRole("button")).toHaveTextContent(
      "folder A > folder A1"
    );
  });
});
