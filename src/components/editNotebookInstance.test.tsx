import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { bindTrigger } from "material-ui-popup-state";
import {
  AccessScope,
  CloningInstructionsEnum,
  ManagedBy,
  ResourceDescription,
  ResourceMetadata,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { CloudNotebooksClient, Instance } from "../lib/cloud/notebooks";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestAuth } from "../testing/auth";
import { TestResourceList } from "../testing/testResourceList";
import {
  EditNotebookInstance,
  useEditNotebookState,
} from "./editNotebookInstance";
import { bindFlyover } from "./flyover";

const TestEditNotebookButton = (props: {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
  instance?: Instance;
}) => {
  const editNotebookState = useEditNotebookState(props.resource);
  return (
    <div>
      <Button {...bindTrigger(editNotebookState)} />
      <EditNotebookInstance {...props} {...bindFlyover(editNotebookState)} />
    </div>
  );
};

describe("edit notebook instance", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { controlledGcpResourceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    const notebookName = "test-name";
    const notebookDescription = "description for test-name";
    const instanceName = "test-instance";

    const aiNotebookInstance =
      await controlledGcpResourceApi.createAiNotebookInstance({
        workspaceId: "test-id",
        createControlledGcpAiNotebookInstanceRequestBody: {
          common: {
            name: notebookName,
            description: notebookDescription,
            cloningInstructions: CloningInstructionsEnum.Nothing,
            accessScope: AccessScope.PrivateAccess,
            managedBy: ManagedBy.User,
          },
          aiNotebookInstance: {
            instanceId: instanceName,
            location: "test-location",
            machineType: "test-type",
            postStartupScript: "test-script",
            containerImage: {
              repository: "gcr.io/test-image",
            },
          },
          jobControl: { id: "test-job" },
        },
      });
    const resource: ResourceDescription = {
      metadata: {
        ...(aiNotebookInstance.aiNotebookInstance
          ?.metadata as ResourceMetadata),
      },
      resourceAttributes: {
        gcpAiNotebookInstance: {
          projectId: "test-project",
          instanceId: instanceName,
          location: "test-location",
        },
      },
    };

    const instance = await new CloudNotebooksClient().getInstance(
      workspace.gcpContext?.projectId || "",
      "test-location",
      instanceName
    );

    const onResourcesUpdate = jest.fn();
    render(
      <TestAuth>
        <FakeApiProvider apis={apis}>
          <TestResourceList
            workspaceId="test-id"
            onUpdate={onResourcesUpdate}
          />
          <TestEditNotebookButton
            workspace={workspace}
            resource={resource}
            instance={instance}
          />
        </FakeApiProvider>
      </TestAuth>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Edit the instance" });

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      notebookName
    );
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      notebookDescription
    );
    expect(
      screen.getByRole("textbox", { name: "Custom environment location" })
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "Custom environment location" })
    ).toHaveValue("gcr.io/test-image");
    expect(
      screen.getByRole("textbox", { name: "Cloud instance name" })
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "Cloud instance name" })
    ).toHaveValue("test-instance");
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();

    const newName = "test-name-new";
    const newDescription = "new test description";
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: newName },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: newDescription },
    });

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Edit the instance" })
    );

    const projectId = workspace.gcpContext?.projectId || "";
    const updatedInstance: Instance =
      await new CloudNotebooksClient().getInstance(
        projectId,
        "test-location",
        instanceName
      );
    const updatedResource =
      await controlledGcpResourceApi.getAiNotebookInstance({
        resourceId: resource.metadata.resourceId,
        workspaceId: resource.metadata.workspaceId,
      });
    expect(updatedResource.metadata.name).toEqual(newName);
    expect(updatedResource.metadata.description).toEqual(newDescription);
    expect(updatedInstance.containerImage?.repository).toEqual(
      "gcr.io/test-image"
    );
  });
});
