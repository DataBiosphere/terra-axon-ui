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
  CreateObjectReferenceProps,
  useCreateObjectReference,
} from "./createObjectReference";

const TestCreateObjectReferenceButton = (props: CreateObjectReferenceProps) => {
  const { createObjectReference, show } = useCreateObjectReference(props);
  return (
    <div>
      <Button onClick={show} />
      {createObjectReference}
    </div>
  );
};

describe("create object reference with gs:// style link", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateObjectReferenceButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Add a Cloud Storage object",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud object URL" }),
      {
        target: { value: "gs://test_bucket_name/test_object_name" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", {
        name: "Add a Cloud Storage object",
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
        gcpGcsObject: {
          bucketName: "test_bucket_name",
          fileName: "test_object_name",
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
    ["Cloud object URL", "", "Provide a bucket object reference"],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(<TestCreateObjectReferenceButton workspace={workspace} />);

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Add a Cloud Storage object",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});

describe("create object reference with cloud storage style link", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateObjectReferenceButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Add a Cloud Storage object",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud object URL" }),
      {
        target: {
          value:
            "https://console.cloud.google.com/storage/browser/_details/test_bucket_name/test_object_name;test_other_flags?project=test_project",
        },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", {
        name: "Add a Cloud Storage object",
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
        gcpGcsObject: {
          bucketName: "test_bucket_name",
          fileName: "test_object_name",
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
    ["Cloud object URL", "", "Provide a bucket object reference"],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(<TestCreateObjectReferenceButton workspace={workspace} />);

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Add a Cloud Storage object",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});
