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
  CreateBigQueryDatasetProps,
  useCreateBigQueryDataset,
} from "./createBigQueryDataset";

const TestCreateDatasetButton = (props: CreateBigQueryDatasetProps) => {
  const { createBigQueryDataset, show } = useCreateBigQueryDataset(props);
  return (
    <div>
      <Button onClick={show} />
      {createBigQueryDataset}
    </div>
  );
};

describe("create bigquery dataset", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    const projectId = workspace.gcpContext?.projectId || "";
    expect(projectId).toBeTruthy();

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateDatasetButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Create a new BigQuery dataset",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Cloud dataset name" }),
      {
        target: { value: "test_dataset_name" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Create a new BigQuery dataset" })
    );

    const expected: ResourceDescription = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test-name",
        description: "test description",
      }),
      resourceAttributes: {
        gcpBqDataset: {
          projectId: projectId,
          datasetId: "test_dataset_name",
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
      "Cloud dataset name",
      "with spaces",
      "Only use lowercase letters, numbers and underscores",
    ],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(<TestCreateDatasetButton workspace={workspace} />);

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Create a new BigQuery dataset",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});
