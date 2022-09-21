import { Icon, IconButton, Link } from "@mui/material";
import { ReactElement } from "react";
import {
  ResourceDescription,
  ResourceType,
  WorkspaceDescription,
} from "../generated/workspacemanager";

export interface OpenResourceButtonProps {
  resource: ResourceDescription;
  workspace: WorkspaceDescription;
}

export function OpenResourceButton({
  workspace,
  resource,
}: OpenResourceButtonProps): ReactElement {
  let href = "";
  switch (resource.metadata?.resourceType) {
    case ResourceType.BigQueryDataset:
      href = `https://console.cloud.google.com/bigquery?d=${resource.resourceAttributes.gcpBqDataset?.datasetId}&p=${resource.resourceAttributes.gcpBqDataset?.projectId}&page=dataset&project=${workspace.gcpContext?.projectId}`;
      break;
    case ResourceType.BigQueryDataTable:
      href = `https://console.cloud.google.com/bigquery?d=${resource.resourceAttributes.gcpBqDataTable?.datasetId}&p=${resource.resourceAttributes.gcpBqDataTable?.projectId}&page=${resource.resourceAttributes.gcpBqDataTable?.dataTableId}&project=${workspace.gcpContext?.projectId}`;
      break;
    case ResourceType.GcsBucket:
      href = `https://console.cloud.google.com/storage/browser/${resource.resourceAttributes.gcpGcsBucket?.bucketName}?project=${workspace.gcpContext?.projectId}`;
      break;
    case ResourceType.GcsObject:
      href = `https://console.cloud.google.com/storage/browser/_details/${resource.resourceAttributes.gcpGcsObject?.bucketName}/${resource.resourceAttributes.gcpGcsObject?.fileName}?project=${workspace.gcpContext?.projectId}`;
      break;
  }
  return href ? (
    <IconButton size="small" component={Link} href={href} target="_blank">
      <Icon>launch</Icon>
    </IconButton>
  ) : (
    <div />
  );
}
