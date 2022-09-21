import { Button } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";
import { SnackbarProvider } from "notistack";
import { Router } from "react-router-dom";
import {
  AccessScope,
  CloningInstructionsEnum,
  ManagedBy,
  ResourceDescription,
  ResourceMetadata,
  ResourceType,
  StewardshipType,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestResourceList } from "../testing/testResourceList";
import { ApiContextType } from "./apiProvider";
import { useDeleteResource } from "./deleteResource";
import { Job } from "./jobs";

jest.mock("./jobs", () => ({
  useJobs: () => ({ addJob: (job: Job) => job.onSuccess?.() }),
}));

const TestDeleteButton = ({ resource }: { resource: ResourceDescription }) => {
  const { run } = useDeleteResource(resource);
  return <Button onClick={run} />;
};

async function createBucket({ controlledGcpResourceApi }: ApiContextType) {
  const created = await controlledGcpResourceApi.createBucket({
    workspaceId: "test-id",
    createControlledGcpGcsBucketRequestBody: {
      common: {
        name: "test-resource-name",
        cloningInstructions: CloningInstructionsEnum.Nothing,
        accessScope: AccessScope.SharedAccess,
        managedBy: ManagedBy.User,
      },
      gcsBucket: {
        name: "test-bucket-name",
        location: "test-location",
      },
    },
  });
  const resource: ResourceDescription = {
    metadata: { ...created.gcpBucket?.metadata },
    resourceAttributes: {},
  };
  return resource;
}

async function createBucketReference({
  referencedGcpResourceApi,
}: ApiContextType) {
  const created = await referencedGcpResourceApi.createBucketReference({
    workspaceId: "test-id",
    createGcpGcsBucketReferenceRequestBody: {
      metadata: {
        name: "test-name",
        cloningInstructions: CloningInstructionsEnum.Nothing,
      },
      bucket: { bucketName: "test-bucket-name" },
    },
  });
  const resource: ResourceDescription = {
    metadata: { ...created.metadata },
    resourceAttributes: {},
  };
  return resource;
}

async function createDataset({ controlledGcpResourceApi }: ApiContextType) {
  const created = await controlledGcpResourceApi.createBigQueryDataset({
    workspaceId: "test-id",
    createControlledGcpBigQueryDatasetRequestBody: {
      common: {
        name: "test-resource-name",
        cloningInstructions: CloningInstructionsEnum.Nothing,
        accessScope: AccessScope.SharedAccess,
        managedBy: ManagedBy.User,
      },
      dataset: {
        datasetId: "test-dataset-name",
        location: "test-location",
      },
    },
  });
  const resource: ResourceDescription = {
    metadata: { ...created.bigQueryDataset?.metadata },
    resourceAttributes: {},
  };
  return resource;
}

async function createDatasetReference({
  referencedGcpResourceApi,
}: ApiContextType) {
  const created = await referencedGcpResourceApi.createBigQueryDatasetReference(
    {
      workspaceId: "test-id",
      createGcpBigQueryDatasetReferenceRequestBody: {
        metadata: {
          name: "test-resource-name",
          cloningInstructions: CloningInstructionsEnum.Nothing,
        },
        dataset: {
          projectId: "test-project-id",
          datasetId: "test-dataset-name",
        },
      },
    }
  );
  const resource: ResourceDescription = {
    metadata: { ...created.metadata },
    resourceAttributes: {},
  };
  return resource;
}

async function createGitRepoReference({
  referencedGcpResourceApi,
}: ApiContextType) {
  const created = await referencedGcpResourceApi.createGitRepoReference({
    workspaceId: "test-id",
    createGitRepoReferenceRequestBody: {
      metadata: {
        name: "test-resource-name",
        cloningInstructions: CloningInstructionsEnum.Nothing,
      },
      gitrepo: { gitRepoUrl: "test url" },
    },
  });
  const resource: ResourceDescription = {
    metadata: { ...created.metadata },
    resourceAttributes: {},
  };
  return resource;
}

async function createNotebook({ controlledGcpResourceApi }: ApiContextType) {
  const created = await controlledGcpResourceApi.createAiNotebookInstance({
    workspaceId: "test-id",
    createControlledGcpAiNotebookInstanceRequestBody: {
      common: {
        name: "test-name",
        cloningInstructions: CloningInstructionsEnum.Nothing,
        accessScope: AccessScope.PrivateAccess,
        managedBy: ManagedBy.User,
      },
      aiNotebookInstance: {
        instanceId: "test-instance-name",
        location: "test-location",
        machineType: "test-type",
        postStartupScript: "test-script",
        vmImage: {
          projectId: "test-project",
          imageFamily: "test-family",
        },
      },
      jobControl: { id: "test-job" },
    },
  });
  const resource: ResourceDescription = {
    metadata: { ...(created.aiNotebookInstance?.metadata as ResourceMetadata) },
    resourceAttributes: {},
  };
  return resource;
}

type CreateFunc = (apis: ApiContextType) => Promise<ResourceDescription>;
type TestType = [string, CreateFunc];

it.each<TestType>([
  ["bucket", createBucket],
  ["bucket reference", createBucketReference],
  ["dataset", createDataset],
  ["dataset reference", createDatasetReference],
  ["notebook", createNotebook],
  ["git repo reference", createGitRepoReference],
])("%s deleted", async (name: string, create: CreateFunc) => {
  const apis = apiFakes();
  const { resourceApi } = apis;
  const workspace = await createTestWorkspace(apis);
  const resource = await create(apis);

  const onResourcesUpdate = jest.fn();
  render(
    <SnackbarProvider>
      <Router history={createMemoryHistory()}>
        <FakeApiProvider apis={apis}>
          <TestResourceList
            workspaceId={workspace.id}
            onUpdate={onResourcesUpdate}
          />
          <TestDeleteButton resource={resource} />
        </FakeApiProvider>
      </Router>
    </SnackbarProvider>
  );

  fireEvent.click(screen.getByRole("button"));

  await waitFor(() => expect(onResourcesUpdate).toHaveBeenCalledWith([]));

  expect(
    (await resourceApi.enumerateResources({ workspaceId: "test-id" })).resources
  ).toEqual([]);
});

it("resource failed to delete", async () => {
  const resource: ResourceDescription = {
    metadata: {
      resourceId: "id-to-delete",
      name: "name-to-delete",
      workspaceId: "test-id",
      stewardshipType: StewardshipType.Controlled,
      resourceType: ResourceType.BigQueryDataset,
    },
    resourceAttributes: {},
  };

  render(
    <SnackbarProvider>
      <Router history={createMemoryHistory()}>
        <FakeApiProvider>
          <TestDeleteButton resource={resource} />
        </FakeApiProvider>
      </Router>
    </SnackbarProvider>
  );

  fireEvent.click(screen.getByRole("button"));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "resource id-to-delete not found in workspace test-id"
  );
});
