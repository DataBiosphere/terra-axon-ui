import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { IamRole, ResourceDescription } from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestResourceList } from "../testing/testResourceList";
import {
  CreateBucketReferenceProps,
  useCreateBucketReference,
} from "./createBucketReference";

const TestCreateBucketReferenceButton = (props: CreateBucketReferenceProps) => {
  const { createBucketReference, show } = useCreateBucketReference(props);
  return (
    <div>
      <Button onClick={show} />
      {createBucketReference}
    </div>
  );
};

describe("create bucket reference", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateBucketReferenceButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Add a Cloud Storage bucket",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud bucket name" }),
      {
        target: { value: "test_bucket_name" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", {
        name: "Add a Cloud Storage bucket",
      })
    );

    const expected: ResourceDescription = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test-name",
        description: "test description",
      }),
      resourceAttributes: {
        gcpGcsBucket: {
          bucketName: "test_bucket_name",
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
    ["Cloud bucket name", "", "Provide a Cloud bucket name"],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(<TestCreateBucketReferenceButton workspace={workspace} />);

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Add a Cloud Storage bucket",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});
