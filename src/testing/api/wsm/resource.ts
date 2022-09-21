import { StatusCodes } from "http-status-codes";
import {
  EnumerateResourcesRequest,
  ResourceApi,
  ResourceDescription,
  ResourceList,
} from "../../../generated/workspacemanager";
import { apiError } from "../error";
import { FakeWorkspaceApi } from "./workspaceApi";

export class FakeResourceApi extends ResourceApi {
  private resources: ResourceDescription[] = [];
  private nextId = 0;

  constructor(private workspaceeApi: FakeWorkspaceApi) {
    super();
  }

  getResource(id: string, workspaceId: string): ResourceDescription {
    const resource = this.resources.find(
      (r) =>
        r.metadata.resourceId === id && r.metadata.workspaceId === workspaceId
    );
    if (!resource) {
      throw apiError(
        StatusCodes.NOT_FOUND,
        `resource ${id} not found in workspace ${workspaceId}`
      );
    }
    return resource;
  }
  getResourceIndex(id: string, workspaceId: string): number {
    const index = this.resources.findIndex(
      (r) =>
        r.metadata.resourceId === id && r.metadata.workspaceId === workspaceId
    );
    if (index < 0)
      throw apiError(
        StatusCodes.NOT_FOUND,
        `resource ${id} not found in workspace ${workspaceId}`
      );
    return index;
  }

  updateResource(
    id: string,
    workspaceId: string,
    updatedResource: ResourceDescription
  ): ResourceDescription {
    const resource = this.getResource(id, workspaceId);
    updatedResource.metadata.resourceId = resource.metadata.resourceId;
    this.resources[this.getResourceIndex(id, workspaceId)] = updatedResource;
    return updatedResource;
  }

  deleteResource(id: string, workspaceId: string): void {
    this.resources.splice(this.getResourceIndex(id, workspaceId), 1);
  }

  insertResource(resource: ResourceDescription): ResourceDescription {
    this.workspaceeApi.getWorkspaceById(resource.metadata.workspaceId);
    if (!resource.metadata || !resource.resourceAttributes) {
      throw apiError(
        StatusCodes.BAD_REQUEST,
        "metadata and attributes are required"
      );
    }
    if (
      this.resources.find(
        (r) =>
          r.metadata?.name === resource.metadata?.name &&
          r.metadata?.workspaceId === resource.metadata?.workspaceId
      )
    ) {
      throw apiError(
        StatusCodes.CONFLICT,
        `resource with name ${resource.metadata?.name} already exists in workspace ${resource.metadata?.workspaceId}`
      );
    }

    resource.metadata.resourceId = "resource" + this.nextId++;
    this.resources.push(resource);
    return resource;
  }

  async enumerateResources(
    request: EnumerateResourcesRequest
  ): Promise<ResourceList> {
    const resources = this.resources.filter(
      (r) => r.metadata?.workspaceId === request.workspaceId
    );
    return Promise.resolve({ resources: resources });
  }
}
