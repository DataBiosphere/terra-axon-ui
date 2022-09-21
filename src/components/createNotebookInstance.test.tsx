import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { IamRole } from "../generated/workspacemanager";
import { CloudNotebooksClient } from "../lib/cloud/notebooks";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestAuth } from "../testing/auth";
import { TestResourceList } from "../testing/testResourceList";
import {
  CreateNotebookInstanceProps,
  useCreateNotebookInstance,
} from "./createNotebookInstance";

const TestCreateNotebookButton = (props: CreateNotebookInstanceProps) => {
  const { createNotebookInstance, show } = useCreateNotebookInstance(props);
  return (
    <div>
      <Button onClick={show} />
      {createNotebookInstance}
    </div>
  );
};

describe("create notebook instance", () => {
  it("set all field is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <TestAuth>
        <FakeApiProvider apis={apis}>
          <TestResourceList
            workspaceId="test-id"
            onUpdate={onResourcesUpdate}
          />
          <TestCreateNotebookButton workspace={workspace} />
        </FakeApiProvider>
      </TestAuth>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Create a new instance" });

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud instance name" }),
      {
        target: { value: "test-instance-name" },
      }
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test-description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom environment location" }),
      {
        target: { value: "gcr.io/deeplearning-platform-release/r-cpu.4-1" },
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      screen.queryByRole("heading", { name: "Create a new instance" })
    ).not.toBeInTheDocument();

    expect(
      await screen.findByText("Create an instance with a custom docker image")
    );
    fireEvent.click(
      await screen.findByLabelText(
        "I am confident that my image is safe and understand the risks involved"
      )
    );
    fireEvent.click(await screen.findByText("Continue"));

    await waitForElementToBeRemoved(() =>
      screen.queryByText("Create an instance with a custom docker image")
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Create a new instance" })
    );
    const expected = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test-name",
        description: "test-description",
      }),
      resourceAttributes: {
        gcpAiNotebookInstance: expect.objectContaining({
          instanceId: "test-instance-name",
        }),
      },
    };
    expect(onResourcesUpdate).toHaveBeenLastCalledWith([expected]);
    expect(
      (await resourceApi.enumerateResources({ workspaceId: "test-id" }))
        .resources
    ).toEqual([expected]);
    const projectId = workspace.gcpContext?.projectId || "";
    const instance = await new CloudNotebooksClient().getInstance(
      projectId,
      "test-location",
      "test-instance-name"
    );
    expect(instance.containerImage?.repository).toEqual(
      "gcr.io/deeplearning-platform-release/r-cpu.4-1"
    );
  });

  it("not set custom image is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <TestAuth>
        <FakeApiProvider apis={apis}>
          <TestResourceList
            workspaceId="test-id"
            onUpdate={onResourcesUpdate}
          />
          <TestCreateNotebookButton workspace={workspace} />
        </FakeApiProvider>
      </TestAuth>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Create a new instance" });

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud instance name" }),
      {
        target: { value: "test-instance-name-2" },
      }
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name-2" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test-description" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Create a new instance" })
    );

    const expected = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test-name-2",
        description: "test-description",
      }),
      resourceAttributes: {
        gcpAiNotebookInstance: expect.objectContaining({
          instanceId: "test-instance-name-2",
        }),
      },
    };
    expect(onResourcesUpdate).toHaveBeenLastCalledWith([expected]);
    expect(
      (await resourceApi.enumerateResources({ workspaceId: "test-id" }))
        .resources
    ).toEqual([expected]);
  });

  it.each<[string, string, string]>([
    ["Name", "", "Provide a name"],
    [
      "Cloud instance name",
      "with spaces",
      "Only use lowercase letters, numbers, and dashes",
    ],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(
        <TestAuth>
          <FakeApiProvider>
            <TestCreateNotebookButton workspace={workspace} />
          </FakeApiProvider>
        </TestAuth>
      );

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", { name: "Create a new instance" });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});
