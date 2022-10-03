import {
  AiNotebookCloudId,
  BqDatasetCloudId,
  ControlledGcpResourceApi,
  ControlledResourceIamRole,
  CreateAiNotebookInstanceRequest,
  CreateBigQueryDatasetRequest,
  CreateBucketRequest,
  CreatedControlledGcpAiNotebookInstanceResult,
  CreatedControlledGcpBigQueryDataset,
  CreatedControlledGcpGcsBucket,
  DeleteAiNotebookInstanceRequest,
  DeleteBigQueryDatasetRequest,
  DeleteBucketRequest,
  DeleteControlledGcpAiNotebookInstanceResult,
  DeleteControlledGcpGcsBucketResult,
  GcpAiNotebookInstanceAttributes,
  GcpAiNotebookInstanceResource,
  GcpBigQueryDatasetAttributes,
  GcpBigQueryDatasetResource,
  GcpGcsBucketAttributes,
  GcpGcsBucketResource,
  GcsBucketCloudName,
  GenerateAiNotebookCloudInstanceIdRequest,
  GenerateBigQueryDatasetCloudIdRequest,
  GenerateGcpGcsBucketCloudNameRequest,
  GetAiNotebookInstanceRequest,
  ResourceType,
  StewardshipType,
  UpdateAiNotebookInstanceRequest,
  UpdateBigQueryDatasetRequest,
  UpdateGcsBucketRequest,
} from "../../../generated/workspacemanager";
import { CloudNotebooksClient } from "../../../lib/cloud/notebooks";
import { TestProfile } from "../../profile";
import { FakeResourceApi } from "./resource";
import { FakeWorkspaceApi } from "./workspaceApi";

const defaultLocation = "test-location";

export class FakeControlledGcpResourceApi extends ControlledGcpResourceApi {
  constructor(
    private resourceApi: FakeResourceApi,
    private workspaceApi: FakeWorkspaceApi,
    private cloudNotebooks: CloudNotebooksClient
  ) {
    super();
  }

  async createBucket(
    request: CreateBucketRequest
  ): Promise<CreatedControlledGcpGcsBucket> {
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        name: request.createControlledGcpGcsBucketRequestBody.common.name,
        description:
          request.createControlledGcpGcsBucketRequestBody.common.description,
        resourceType: ResourceType.GcsBucket,
        stewardshipType: StewardshipType.Controlled,
        cloningInstructions:
          request.createControlledGcpGcsBucketRequestBody.common
            .cloningInstructions,
        controlledResourceMetadata: {
          privateResourceUser: {
            userName: TestProfile.email,
            privateResourceIamRole: ControlledResourceIamRole.Editor,
          },
          ...request.createControlledGcpGcsBucketRequestBody.common,
        },
      },
      resourceAttributes: {
        gcpGcsBucket: {
          bucketName:
            request.createControlledGcpGcsBucketRequestBody.gcsBucket?.name ||
            "",
        },
      },
    });
    return Promise.resolve({
      resourceId: resource.metadata.resourceId,
      gcpBucket: {
        metadata: resource.metadata,
        attributes: resource.resourceAttributes
          ?.gcpGcsBucket as GcpGcsBucketAttributes,
      },
    });
  }

  async updateGcsBucket(
    request: UpdateGcsBucketRequest
  ): Promise<GcpGcsBucketResource> {
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );

    const resource = this.resourceApi.updateResource(
      request.resourceId,
      request.workspaceId,
      {
        metadata: {
          ...originalResource.metadata,
          name:
            request.updateControlledGcpGcsBucketRequestBody.name ||
            originalResource.metadata.name,
          description:
            request.updateControlledGcpGcsBucketRequestBody.description ||
            originalResource.metadata.description,
        },
        resourceAttributes: { ...originalResource.resourceAttributes },
      }
    );
    return Promise.resolve({
      metadata: resource.metadata,
      attributes: resource.resourceAttributes
        ?.gcpGcsBucket as GcpGcsBucketAttributes,
    });
  }

  async generateGcpGcsBucketCloudName(
    request: GenerateGcpGcsBucketCloudNameRequest
  ): Promise<GcsBucketCloudName> {
    const projectId = this.workspaceApi.getWorkspaceProjectId(
      request.workspaceId
    );
    const bucketPart =
      request.generateGcpGcsBucketCloudNameRequestBody.gcsBucketName.replace(
        /_/g,
        "-"
      );
    return Promise.resolve({
      generatedBucketCloudName: `${bucketPart}-${projectId}`,
    });
  }

  async createBigQueryDataset(
    request: CreateBigQueryDatasetRequest
  ): Promise<CreatedControlledGcpBigQueryDataset> {
    const workspace = this.workspaceApi.getWorkspaceById(request.workspaceId);
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        name: request.createControlledGcpBigQueryDatasetRequestBody.common.name,
        description:
          request.createControlledGcpBigQueryDatasetRequestBody.common
            .description,
        resourceType: ResourceType.BigQueryDataset,
        stewardshipType: StewardshipType.Controlled,
        cloningInstructions:
          request.createControlledGcpBigQueryDatasetRequestBody.common
            .cloningInstructions,
        controlledResourceMetadata: {
          privateResourceUser: {
            userName: TestProfile.email,
            privateResourceIamRole: ControlledResourceIamRole.Editor,
          },
          ...request.createControlledGcpBigQueryDatasetRequestBody.common,
        },
      },
      resourceAttributes: {
        gcpBqDataset: {
          projectId: workspace.gcpContext?.projectId || "",
          datasetId:
            request.createControlledGcpBigQueryDatasetRequestBody.dataset
              ?.datasetId || "",
        },
      },
    });
    return Promise.resolve({
      resourceId: resource.metadata.resourceId,
      bigQueryDataset: {
        metadata: resource.metadata,
        attributes: resource.resourceAttributes
          ?.gcpBqDataset as GcpBigQueryDatasetAttributes,
      },
    });
  }

  async updateBigQueryDataset(
    request: UpdateBigQueryDatasetRequest
  ): Promise<GcpBigQueryDatasetResource> {
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );

    const resource = this.resourceApi.updateResource(
      request.resourceId,
      request.workspaceId,
      {
        metadata: {
          ...originalResource.metadata,
          name:
            request.updateControlledGcpBigQueryDatasetRequestBody.name ||
            originalResource.metadata.name,
          description:
            request.updateControlledGcpBigQueryDatasetRequestBody.description ||
            originalResource.metadata.description,
        },
        resourceAttributes: { ...originalResource.resourceAttributes },
      }
    );
    return Promise.resolve({
      metadata: resource.metadata,
      attributes: resource.resourceAttributes
        ?.gcpBqDataset as GcpBigQueryDatasetAttributes,
    });
  }

  async generateBigQueryDatasetCloudId(
    request: GenerateBigQueryDatasetCloudIdRequest
  ): Promise<BqDatasetCloudId> {
    return Promise.resolve({
      generatedDatasetCloudId:
        request.generateGcpBigQueryDatasetCloudIDRequestBody.bigQueryDatasetName.replaceAll(
          "-",
          "_"
        ),
    });
  }

  async deleteBucket(
    request: DeleteBucketRequest
  ): Promise<DeleteControlledGcpGcsBucketResult> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
    return Promise.resolve({});
  }

  async deleteBigQueryDataset(
    request: DeleteBigQueryDatasetRequest
  ): Promise<void> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
  }

  async getAiNotebookInstance(
    request: GetAiNotebookInstanceRequest
  ): Promise<GcpAiNotebookInstanceResource> {
    const resource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    return Promise.resolve({
      metadata: resource.metadata,
      attributes: resource.resourceAttributes
        ?.gcpAiNotebookInstance as GcpAiNotebookInstanceAttributes,
    });
  }

  async deleteAiNotebookInstance(
    request: DeleteAiNotebookInstanceRequest
  ): Promise<DeleteControlledGcpAiNotebookInstanceResult> {
    this.resourceApi.deleteResource(request.resourceId, request.workspaceId);
    return Promise.resolve({});
  }

  async updateAiNotebookInstance(
    request: UpdateAiNotebookInstanceRequest
  ): Promise<GcpAiNotebookInstanceResource> {
    const projectId = this.workspaceApi.getWorkspaceProjectId(
      request.workspaceId
    );
    const originalResource = this.resourceApi.getResource(
      request.resourceId,
      request.workspaceId
    );
    const gcpAiNotebookAttributes =
      originalResource.resourceAttributes.gcpAiNotebookInstance;
    const location = gcpAiNotebookAttributes?.location || "";
    const instanceId = gcpAiNotebookAttributes?.instanceId || "";
    const originalInstance = await this.cloudNotebooks.getInstance(
      projectId,
      location,
      instanceId
    );
    originalInstance.metadata =
      request.updateControlledGcpAiNotebookInstanceRequestBody.updateParameters
        ?.metadata || originalInstance.metadata;

    await this.cloudNotebooks.updateInstance(
      projectId,
      location,
      instanceId,
      originalInstance
    );

    const resource = this.resourceApi.updateResource(
      request.resourceId,
      request.workspaceId,
      {
        metadata: {
          resourceId: "",
          workspaceId: request.workspaceId,
          name:
            request.updateControlledGcpAiNotebookInstanceRequestBody.name ||
            originalResource.metadata.name,
          description:
            request.updateControlledGcpAiNotebookInstanceRequestBody
              .description || originalResource.metadata.description,
          resourceType: ResourceType.AiNotebook,
          stewardshipType: StewardshipType.Controlled,
          cloningInstructions: originalResource.metadata.cloningInstructions,
          controlledResourceMetadata: {
            ...originalResource.metadata.controlledResourceMetadata,
          },
        },
        resourceAttributes: {
          gcpAiNotebookInstance: {
            projectId: projectId,
            location: gcpAiNotebookAttributes?.location || "",
            instanceId: gcpAiNotebookAttributes?.instanceId || "",
          },
        },
      }
    );
    return Promise.resolve({
      metadata: resource.metadata,
      attributes: resource.resourceAttributes
        ?.gcpAiNotebookInstance as GcpAiNotebookInstanceAttributes,
    });
  }

  async createAiNotebookInstance(
    request: CreateAiNotebookInstanceRequest
  ): Promise<CreatedControlledGcpAiNotebookInstanceResult> {
    const projectId = this.workspaceApi.getWorkspaceProjectId(
      request.workspaceId
    );
    const location =
      request.createControlledGcpAiNotebookInstanceRequestBody
        .aiNotebookInstance.location || defaultLocation;
    const instanceId =
      request.createControlledGcpAiNotebookInstanceRequestBody
        .aiNotebookInstance.instanceId || "";
    const containerImage =
      request.createControlledGcpAiNotebookInstanceRequestBody
        .aiNotebookInstance.containerImage;
    const metadata =
      request.createControlledGcpAiNotebookInstanceRequestBody
        .aiNotebookInstance.metadata;
    await this.cloudNotebooks.createInstance(projectId, location, instanceId, {
      name: "",
      proxyUri: "",
      state: "",
      ...(containerImage
        ? {
            containerImage: {
              repository: containerImage.repository,
              tag: containerImage.tag,
            },
          }
        : undefined),
      metadata: metadata,
    });
    const resource = this.resourceApi.insertResource({
      metadata: {
        resourceId: "",
        workspaceId: request.workspaceId,
        name: request.createControlledGcpAiNotebookInstanceRequestBody.common
          .name,
        description:
          request.createControlledGcpAiNotebookInstanceRequestBody.common
            .description,
        resourceType: ResourceType.AiNotebook,
        stewardshipType: StewardshipType.Controlled,
        cloningInstructions:
          request.createControlledGcpAiNotebookInstanceRequestBody.common
            .cloningInstructions,
        controlledResourceMetadata: {
          privateResourceUser: {
            userName: TestProfile.email,
            privateResourceIamRole: ControlledResourceIamRole.Editor,
          },
          ...request.createControlledGcpAiNotebookInstanceRequestBody.common,
        },
      },
      resourceAttributes: {
        gcpAiNotebookInstance: {
          projectId: projectId,
          location: location,
          instanceId: instanceId,
        },
      },
    });
    return Promise.resolve({
      aiNotebookInstance: {
        metadata: resource.metadata,
        attributes: resource.resourceAttributes
          ?.gcpAiNotebookInstance as GcpAiNotebookInstanceAttributes,
      },
    });
  }

  async generateAiNotebookCloudInstanceId(
    request: GenerateAiNotebookCloudInstanceIdRequest
  ): Promise<AiNotebookCloudId> {
    return Promise.resolve({
      generatedAiNotebookAiNotebookCloudId:
        request.generateGcpAiNotebookCloudIdRequestBody.aiNotebookName,
    });
  }
}
