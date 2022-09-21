import { render, screen } from "@testing-library/react";
import { ResourceType } from "../generated/workspacemanager";
import { ResourceIcon } from "./resourceIcon";

describe("resource icon", () => {
  it.each<[ResourceType, string, /* unknown icon */ boolean]>([
    [ResourceType.AzureIp, "AZURE_IP", true],
    [ResourceType.GcsBucket, "Cloud Storage bucket", false],
    [ResourceType.GcsObject, "Cloud Storage object", false],
    [ResourceType.BigQueryDataset, "BigQuery dataset", false],
    [ResourceType.BigQueryDataTable, "BigQuery table", false],
  ])(
    "renders for %s",
    (resourceType: ResourceType, label: string, unknownIcon: boolean) => {
      render(<ResourceIcon resourceType={resourceType} />);
      screen.getByLabelText(label);

      const icon = screen.queryByText("question_mark");
      if (unknownIcon) {
        expect(icon).toBeInTheDocument();
      } else {
        expect(icon).not.toBeInTheDocument();
      }
    }
  );
});
