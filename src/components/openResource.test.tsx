import { render, screen } from "@testing-library/react";
import {
  IamRole,
  ResourceDescription,
  ResourceType,
  StewardshipType,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { OpenResourceButton } from "./openResource";

describe("open resource button", () => {
  const workspace: WorkspaceDescription = {
    id: "test-id",
    userFacingId: "test-ufid",
    highestRole: IamRole.Owner,
    gcpContext: { projectId: "test-project" },
  };
  it("renders bucket", async () => {
    const resource: ResourceDescription = {
      metadata: {
        workspaceId: "test-workspace-id",
        resourceId: "test-resource-id",
        name: "test-name",
        resourceType: ResourceType.GcsBucket,
        stewardshipType: StewardshipType.Controlled,
      },
      resourceAttributes: { gcpGcsBucket: { bucketName: "test-bucket" } },
    };
    render(<OpenResourceButton workspace={workspace} resource={resource} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://console.cloud.google.com/storage/browser/test-bucket?project=test-project"
    );
  });

  it("renders dataset", async () => {
    const resource: ResourceDescription = {
      metadata: {
        workspaceId: "test-workspace-id",
        resourceId: "test-resource-id",
        name: "test-name",
        resourceType: ResourceType.BigQueryDataset,
        stewardshipType: StewardshipType.Controlled,
      },
      resourceAttributes: {
        gcpBqDataset: {
          datasetId: "test-dataset",
          projectId: "test-dataset-project",
        },
      },
    };
    render(<OpenResourceButton workspace={workspace} resource={resource} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://console.cloud.google.com/bigquery?d=test-dataset&p=test-dataset-project&page=dataset&project=test-project"
    );
  });

  it("renders other", async () => {
    const resource: ResourceDescription = {
      metadata: {
        workspaceId: "test-workspace-id",
        resourceId: "test-resource-id",
        name: "test-name",
        resourceType: ResourceType.AzureVm,
        stewardshipType: StewardshipType.Controlled,
      },
      resourceAttributes: {},
    };
    render(<OpenResourceButton workspace={workspace} resource={resource} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
