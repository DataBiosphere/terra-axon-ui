import {
  CloneGcpBigQueryDatasetReferenceRequest,
  CloneGcpBigQueryDataTableReferenceRequest,
  CloneGcpGcsBucketReferenceRequest,
  CloneGcpGcsObjectReferenceRequest,
  CloneGitRepoReferenceRequest,
  CloneReferencedGcpBigQueryDatasetResourceResult,
  CloneReferencedGcpBigQueryDataTableResourceResult,
  CloneReferencedGcpGcsBucketResourceResult,
  CloneReferencedGcpGcsObjectResourceResult,
  CloneReferencedGitRepoResourceResult,
  CreateBigQueryDatasetReferenceRequest,
  CreateBigQueryDataTableReferenceRequest,
  CreateBucketReferenceRequest,
  CreateGcsObjectReferenceRequest,
  CreateGitRepoReferenceRequest,
  DeleteBigQueryDatasetReferenceRequest,
  DeleteBigQueryDataTableReferenceRequest,
  DeleteBucketReferenceRequest,
  DeleteGcsObjectReferenceRequest,
  DeleteGitRepoReferenceRequest,
  GcpBigQueryDatasetAttributes,
  GcpBigQueryDatasetResource,
  GcpBigQueryDataTableAttributes,
  GcpBigQueryDataTableResource,
  GcpGcsBucketAttributes,
  GcpGcsBucketResource,
  GcpGcsObjectAttributes,
  GcpGcsObjectResource,
  GetBigQueryDatasetReferenceRequest,
  GetBigQueryDataTableReferenceRequest,
  GetBucketReferenceRequest,
  GetGcsObjectReferenceRequest,
  GitRepoAttributes,
  GitRepoResource,
  ReferencedGcpResourceApi,
  ResourceDescription,
  ResourceType,
  StewardshipType,
  UpdateBigQueryDatasetReferenceResourceRequest,
  UpdateBigQueryDataTableReferenceResourceRequest,
  UpdateBucketObjectReferenceResourceRequest,
  UpdateBucketReferenceResourceRequest,
} from "../../../generated/workspacemanager";
import { FakeResourceApi } from "./resource";

export class FakeReferencedGcpResourceApi extends ReferencedGcpResourceApi {
  constructor(private resourceApi: FakeResourceApi) {
    super();
  }

  async createBucketReference(
    request: CreateBucketReferenceRequest
  ): Promise<GcpGcsBucketResource> {
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        resourceType: ResourceType.GcsBucket,
        stewardshipType: StewardshipType.Referenced,
        ...request.createGcpGcsBucketReferenceRequestBody.metadata,
      },
      resourceAttributes: {
        gcpGcsBucket: {
          bucketName:
            request.createGcpGcsBucketReferenceRequestBody.bucket.bucketName,
        },
      },
    });
    return Promise.resolve(resourceToBucket(resource));
  }

  async updateBucketReferenceResource(
    request: UpdateBucketReferenceResourceRequest
  ): Promise<void> {
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );

    this.resourceApi.updateResource(request.resourceId, request.workspaceId, {
      metadata: {
        ...originalResource.metadata,
        name:
          request.updateGcsBucketReferenceRequestBody.name ||
          originalResource.metadata.name,
        description:
          request.updateGcsBucketReferenceRequestBody.description ||
          originalResource.metadata.description,
      },
      resourceAttributes: {
        gcpGcsBucket: {
          bucketName:
            request.updateGcsBucketReferenceRequestBody.bucketName ||
            originalResource.resourceAttributes.gcpGcsBucket?.bucketName ||
            "",
        },
      },
    });
  }

  async getBucketReference(
    request: GetBucketReferenceRequest
  ): Promise<GcpGcsBucketResource> {
    const resource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    return Promise.resolve(resourceToBucket(resource));
  }

  async cloneGcpGcsBucketReference(
    request: CloneGcpGcsBucketReferenceRequest
  ): Promise<CloneReferencedGcpGcsBucketResourceResult> {
    return Promise.resolve({
      resource: resourceToBucket(this.cloneResourceReference(request)),
    });
  }

  async createGcsObjectReference(
    request: CreateGcsObjectReferenceRequest
  ): Promise<GcpGcsObjectResource> {
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        resourceType: ResourceType.GcsObject,
        stewardshipType: StewardshipType.Referenced,
        ...request.createGcpGcsObjectReferenceRequestBody.metadata,
      },
      resourceAttributes: {
        gcpGcsObject: request.createGcpGcsObjectReferenceRequestBody.file,
      },
    });
    return Promise.resolve(resourceToObject(resource));
  }

  async updateBucketObjectReferenceResource(
    request: UpdateBucketObjectReferenceResourceRequest
  ): Promise<void> {
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );

    this.resourceApi.updateResource(request.resourceId, request.workspaceId, {
      metadata: {
        ...originalResource.metadata,
        name:
          request.updateGcsBucketObjectReferenceRequestBody.name ||
          originalResource.metadata.name,
        description:
          request.updateGcsBucketObjectReferenceRequestBody.description ||
          originalResource.metadata.description,
      },
      resourceAttributes: {
        gcpGcsObject: {
          bucketName:
            request.updateGcsBucketObjectReferenceRequestBody.bucketName ||
            originalResource.resourceAttributes.gcpGcsBucket?.bucketName ||
            "",
          fileName:
            request.updateGcsBucketObjectReferenceRequestBody.objectName ||
            originalResource.resourceAttributes.gcpGcsObject?.fileName ||
            "",
        },
      },
    });
  }

  async getGcsObjectReference(
    request: GetGcsObjectReferenceRequest
  ): Promise<GcpGcsObjectResource> {
    const resource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    return Promise.resolve(resourceToObject(resource));
  }

  async cloneGcpGcsObjectReference(
    request: CloneGcpGcsObjectReferenceRequest
  ): Promise<CloneReferencedGcpGcsObjectResourceResult> {
    return Promise.resolve({
      resource: resourceToObject(this.cloneResourceReference(request)),
    });
  }

  async createBigQueryDatasetReference(
    request: CreateBigQueryDatasetReferenceRequest
  ): Promise<GcpBigQueryDatasetResource> {
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        resourceType: ResourceType.BigQueryDataset,
        stewardshipType: StewardshipType.Referenced,
        ...request.createGcpBigQueryDatasetReferenceRequestBody.metadata,
      },
      resourceAttributes: {
        gcpBqDataset: {
          ...request.createGcpBigQueryDatasetReferenceRequestBody.dataset,
        },
      },
    });
    return Promise.resolve(resourceToDataset(resource));
  }

  async updateBigQueryDatasetReferenceResource(
    request: UpdateBigQueryDatasetReferenceResourceRequest
  ): Promise<void> {
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );

    this.resourceApi.updateResource(request.resourceId, request.workspaceId, {
      metadata: {
        ...originalResource.metadata,
        name:
          request.updateBigQueryDatasetReferenceRequestBody.name ||
          originalResource.metadata.name,
        description:
          request.updateBigQueryDatasetReferenceRequestBody.description ||
          originalResource.metadata.description,
      },
      resourceAttributes: {
        gcpBqDataset: {
          datasetId:
            request.updateBigQueryDatasetReferenceRequestBody.datasetId ||
            originalResource.resourceAttributes.gcpBqDataset?.datasetId ||
            "",
          projectId:
            request.updateBigQueryDatasetReferenceRequestBody.projectId ||
            originalResource.resourceAttributes.gcpBqDataset?.projectId ||
            "",
        },
      },
    });
  }

  async getBigQueryDatasetReference(
    request: GetBigQueryDatasetReferenceRequest
  ): Promise<GcpBigQueryDatasetResource> {
    const resource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    return Promise.resolve(resourceToDataset(resource));
  }

  async cloneGcpBigQueryDatasetReference(
    request: CloneGcpBigQueryDatasetReferenceRequest
  ): Promise<CloneReferencedGcpBigQueryDatasetResourceResult> {
    return Promise.resolve({
      resource: resourceToDataset(this.cloneResourceReference(request)),
    });
  }

  async createBigQueryDataTableReference(
    request: CreateBigQueryDataTableReferenceRequest
  ): Promise<GcpBigQueryDataTableResource> {
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        resourceType: ResourceType.BigQueryDataTable,
        stewardshipType: StewardshipType.Referenced,
        ...request.createGcpBigQueryDataTableReferenceRequestBody.metadata,
      },
      resourceAttributes: {
        gcpBqDataTable: {
          ...request.createGcpBigQueryDataTableReferenceRequestBody.dataTable,
        },
      },
    });
    return Promise.resolve(resourceToDataTable(resource));
  }

  async updateBigQueryDataTableReferenceResource(
    request: UpdateBigQueryDataTableReferenceResourceRequest
  ): Promise<void> {
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );

    this.resourceApi.updateResource(request.resourceId, request.workspaceId, {
      metadata: {
        ...originalResource.metadata,
        name:
          request.updateBigQueryDataTableReferenceRequestBody.name ||
          originalResource.metadata.name,
        description:
          request.updateBigQueryDataTableReferenceRequestBody.description ||
          originalResource.metadata.description,
      },
      resourceAttributes: {
        gcpBqDataTable: {
          datasetId:
            request.updateBigQueryDataTableReferenceRequestBody.datasetId ||
            originalResource.resourceAttributes.gcpBqDataset?.datasetId ||
            "",
          projectId:
            request.updateBigQueryDataTableReferenceRequestBody.projectId ||
            originalResource.resourceAttributes.gcpBqDataset?.projectId ||
            "",
          dataTableId:
            request.updateBigQueryDataTableReferenceRequestBody.dataTableId ||
            originalResource.resourceAttributes.gcpBqDataTable?.dataTableId ||
            "",
        },
      },
    });
  }

  async getBigQueryDataTableReference(
    request: GetBigQueryDataTableReferenceRequest
  ): Promise<GcpBigQueryDataTableResource> {
    const resource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    return Promise.resolve(resourceToDataTable(resource));
  }

  async cloneGcpBigQueryDataTableReference(
    request: CloneGcpBigQueryDataTableReferenceRequest
  ): Promise<CloneReferencedGcpBigQueryDataTableResourceResult> {
    return Promise.resolve({
      resource: resourceToDataTable(this.cloneResourceReference(request)),
    });
  }

  async createGitRepoReference(
    request: CreateGitRepoReferenceRequest
  ): Promise<GitRepoResource> {
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        resourceType: ResourceType.GitRepo,
        stewardshipType: StewardshipType.Referenced,
        ...request.createGitRepoReferenceRequestBody.metadata,
      },
      resourceAttributes: {
        gitRepo: { ...request.createGitRepoReferenceRequestBody.gitrepo },
      },
    });
    return Promise.resolve({
      metadata: resource.metadata,
      attributes: resource.resourceAttributes?.gitRepo as GitRepoAttributes,
    });
  }

  async cloneGitRepoReference(
    request: CloneGitRepoReferenceRequest
  ): Promise<CloneReferencedGitRepoResourceResult> {
    return Promise.resolve({
      resource: resourceToGitRepo(this.cloneResourceReference(request)),
    });
  }

  async deleteBucketReference(
    request: DeleteBucketReferenceRequest
  ): Promise<void> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
  }

  async deleteGcsObjectReference(
    request: DeleteGcsObjectReferenceRequest
  ): Promise<void> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
  }

  async deleteBigQueryDatasetReference(
    request: DeleteBigQueryDatasetReferenceRequest
  ): Promise<void> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
  }

  async deleteBigQueryDataTableReference(
    request: DeleteBigQueryDataTableReferenceRequest
  ): Promise<void> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
  }

  async deleteGitRepoReference(
    request: DeleteGitRepoReferenceRequest
  ): Promise<void> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
  }

  cloneResourceReference(request: {
    workspaceId: string;
    resourceId: string;
    cloneReferencedResourceRequestBody: {
      destinationWorkspaceId: string;
    };
  }): ResourceDescription {
    const source = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    return this.resourceApi.insertResource({
      metadata: {
        ...source.metadata,
        workspaceId:
          request.cloneReferencedResourceRequestBody.destinationWorkspaceId,
        resourceLineage: [
          ...(source.metadata.resourceLineage || []),
          {
            sourceWorkspaceId: request.workspaceId,
            sourceResourceId: request.resourceId,
          },
        ],
      },
      resourceAttributes: { ...source.resourceAttributes },
    });
  }
}

const resourceToBucket = (resource: ResourceDescription) => ({
  metadata: resource.metadata,
  attributes: resource.resourceAttributes
    ?.gcpGcsBucket as GcpGcsBucketAttributes,
});

const resourceToObject = (resource: ResourceDescription) => ({
  metadata: resource.metadata,
  attributes: resource.resourceAttributes
    ?.gcpGcsObject as GcpGcsObjectAttributes,
});

const resourceToDataset = (resource: ResourceDescription) => ({
  metadata: resource.metadata,
  attributes: resource.resourceAttributes
    ?.gcpBqDataset as GcpBigQueryDatasetAttributes,
});

const resourceToDataTable = (resource: ResourceDescription) => ({
  metadata: resource.metadata,
  attributes: resource.resourceAttributes
    ?.gcpBqDataTable as GcpBigQueryDataTableAttributes,
});

const resourceToGitRepo = (resource: ResourceDescription) => ({
  metadata: resource.metadata,
  attributes: resource.resourceAttributes?.gitRepo as GitRepoAttributes,
});
