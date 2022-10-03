import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import {
  AccessScope,
  CloningInstructionsEnum,
  IamRole,
  ManagedBy,
  ResourceDescription,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestResourceList } from "../testing/testResourceList";
import { CreateBucketProps, useCreateBucket } from "./createBucket";

const TestCreateBucketButton = (props: CreateBucketProps) => {
  const { createBucket, show } = useCreateBucket(props);
  return (
    <div>
      <Button onClick={show} />
      {createBucket}
    </div>
  );
};

describe("create bucket", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateBucketButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Create a new Cloud Storage bucket",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test_name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test_description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud bucket name" }),
      {
        target: { value: "test-bucket-name" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", {
        name: "Create a new Cloud Storage bucket",
      })
    );

    const expected: ResourceDescription = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test_name",
        description: "test_description",
      }),
      resourceAttributes: {
        gcpGcsBucket: {
          bucketName: "test-bucket-name",
        },
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
      "Cloud bucket name",
      "with spaces",
      "Only use lowercase letters, numbers and dashes",
    ],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(<TestCreateBucketButton workspace={workspace} />);

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Create a new Cloud Storage bucket",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );

  it("fails to submit", async () => {
    const apis = apiFakes();
    const { controlledGcpResourceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    await controlledGcpResourceApi.createBucket({
      workspaceId: workspace.id,
      createControlledGcpGcsBucketRequestBody: {
        common: {
          name: "test_name",
          cloningInstructions: CloningInstructionsEnum.Nothing,
          accessScope: AccessScope.SharedAccess,
          managedBy: ManagedBy.User,
        },
        gcsBucket: {},
      },
    });

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateBucketButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Create a new Cloud Storage bucket",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test_name" },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "resource with name test_name already exists in workspace test-id"
    );
  });
});
