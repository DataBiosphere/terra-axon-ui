import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import {
  IamRole,
  ResourceDescription,
  ResourceType,
  StewardshipType,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestResourceList } from "../testing/testResourceList";
import {
  CreateBigQueryDatasetReferenceProps,
  useCreateBigQueryDatasetReference,
} from "./createBigQueryDatasetReference";

const TestCreateBigQueryDatasetReferenceButton = (
  props: CreateBigQueryDatasetReferenceProps
) => {
  const { createBigQueryDatasetReference, show } =
    useCreateBigQueryDatasetReference(props);
  return (
    <div>
      <Button onClick={show} />
      {createBigQueryDatasetReference}
    </div>
  );
};

describe("create bigquery dataset reference", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateBigQueryDatasetReferenceButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Add a BigQuery dataset",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud dataset name" }),
      { target: { value: "test_dataset_name" } }
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Project ID" }), {
      target: { value: "test-project-id" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", {
        name: "Add a BigQuery dataset",
      })
    );

    const expected: ResourceDescription = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test-name",
        description: "test description",
        resourceType: ResourceType.BigQueryDataset,
        stewardshipType: StewardshipType.Referenced,
      }),
      resourceAttributes: {
        gcpBqDataset: {
          datasetId: "test_dataset_name",
          projectId: "test-project-id",
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
    ["Cloud dataset name", "", "Provide a Cloud dataset name"],
    ["Project ID", "", "Provide a project ID"],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(
        <TestCreateBigQueryDatasetReferenceButton workspace={workspace} />
      );

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Add a BigQuery dataset",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});
