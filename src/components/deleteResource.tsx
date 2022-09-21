import { useCallback } from "react";
import { useAsync } from "react-async";
import { v4 as uuidv4 } from "uuid";
import {
  JobControl,
  ResourceDescription,
  ResourceType,
  StewardshipType,
} from "../generated/workspacemanager";
import { useJobAdded } from "./api/jobList";
import { useResourceDeleted } from "./api/resourceList";
import { useApi } from "./apiProvider";
import { useSnackbarErrorHandler } from "./errorhandler";
import { useJobs } from "./jobs";

interface State {
  isPending: boolean;
  run: () => void;
}

export function useDeleteResource(resource: ResourceDescription): State {
  const { controlledGcpResourceApi, referencedGcpResourceApi } = useApi();
  const resourceDeleted = useResourceDeleted();
  const { addJob } = useJobs();
  const jobAdded = useJobAdded();
  const deleteFunc = useCallback(async () => {
    const func = async (req: { resourceId: string; workspaceId: string }) => {
      const jobControl: JobControl = { id: uuidv4() };
      if (resource.metadata?.stewardshipType === StewardshipType.Controlled) {
        switch (resource.metadata?.resourceType) {
          case ResourceType.BigQueryDataset:
            await controlledGcpResourceApi.deleteBigQueryDataset(req);
            resourceDeleted(resource);
            return;
          case ResourceType.GcsBucket:
            await controlledGcpResourceApi.deleteBucket({
              ...req,
              deleteControlledGcpGcsBucketRequest: { jobControl: jobControl },
            });
            addJob({
              entityId: req.resourceId,
              jobId: jobControl.id,
              action: "deleting Cloud Storage bucket",
              onSuccess: () => resourceDeleted(resource),
            });
            jobAdded(req.workspaceId);
            return;
          case ResourceType.AiNotebook:
            await controlledGcpResourceApi.deleteAiNotebookInstance({
              ...req,
              deleteControlledGcpAiNotebookInstanceRequest: {
                jobControl: jobControl,
              },
            });
            addJob({
              entityId: req.resourceId,
              jobId: jobControl.id,
              action: "deleting instance",
              onSuccess: () => resourceDeleted(resource),
            });
            jobAdded(req.workspaceId);
            return;
        }
      } else {
        switch (resource.metadata?.resourceType) {
          case ResourceType.GcsBucket:
            await referencedGcpResourceApi.deleteBucketReference(req);
            resourceDeleted(resource);
            return;
          case ResourceType.GcsObject:
            await referencedGcpResourceApi.deleteGcsObjectReference(req);
            resourceDeleted(resource);
            return;
          case ResourceType.BigQueryDataset:
            await referencedGcpResourceApi.deleteBigQueryDatasetReference(req);
            resourceDeleted(resource);
            return;
          case ResourceType.BigQueryDataTable:
            await referencedGcpResourceApi.deleteBigQueryDataTableReference(
              req
            );
            resourceDeleted(resource);
            return;
          case ResourceType.GitRepo:
            await referencedGcpResourceApi.deleteGitRepoReference(req);
            resourceDeleted(resource);
            return;
        }
      }
      throw new Error("Unsupported resource type for delete");
    };
    await func({
      workspaceId: resource.metadata?.workspaceId || "",
      resourceId: resource.metadata?.resourceId || "",
    });
  }, [
    resource,
    controlledGcpResourceApi,
    resourceDeleted,
    addJob,
    jobAdded,
    referencedGcpResourceApi,
  ]);

  const errorHandler = useSnackbarErrorHandler();
  const { run, isPending } = useAsync<void>({
    deferFn: deleteFunc,
    onReject: errorHandler,
  });
  return { run: run, isPending: isPending };
}
