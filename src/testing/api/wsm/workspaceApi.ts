import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import { ResourcesApi } from "../../../generated/sam";
import {
  CloneWorkspaceOperationRequest,
  CloneWorkspaceResult,
  CreateCloudContextOperationRequest,
  CreateCloudContextResult,
  CreatedWorkspace,
  CreateWorkspaceRequest,
  DeleteWorkspaceRequest,
  GetRolesRequest,
  GetWorkspaceByUserFacingIdRequest,
  GetWorkspaceRequest,
  GrantRoleRequest,
  IamRole,
  JobReport,
  JobReportStatusEnum,
  OperationType,
  RemoveRoleRequest,
  RoleBinding,
  UpdateWorkspaceRequest,
  WorkspaceApi,
  WorkspaceDescription,
  WorkspaceDescriptionList,
} from "../../../generated/workspacemanager";
import { ALL_ROLES } from "../../../lib/api/roles";
import { TestProfile } from "../../profile";
import { apiError } from "../error";
import { headerInt } from "../headers";
import { FakeGoogleApi } from "../sam/google";
import { FakeJobsApi } from "./jobs";

const projectPrefix = "terra-fakegcp-";

export class FakeWorkspaceApi extends WorkspaceApi {
  private workspaces: WorkspaceDescription[] = [];

  constructor(
    private jobsApi: FakeJobsApi,
    private googleApi: FakeGoogleApi,
    private resourcesApi: ResourcesApi
  ) {
    super();
  }

  async listWorkspaces(): Promise<WorkspaceDescriptionList> {
    return Promise.resolve({ workspaces: this.workspaces });
  }

  getWorkspaceIndexById(id: string): number {
    const index = this.workspaces.findIndex((ws) => ws.id === id);
    if (index < 0) {
      throw apiError(
        StatusCodes.NOT_FOUND,
        `workspace with id ${id} not found`
      );
    }
    return index;
  }

  getWorkspaceIndexByUserFacingId(ufid: string): number {
    const index = this.workspaces.findIndex((ws) => ws.userFacingId === ufid);
    if (index < 0) {
      throw apiError(
        StatusCodes.NOT_FOUND,
        `workspace with ufid ${ufid} not found`
      );
    }
    return index;
  }

  getWorkspaceById(id: string): WorkspaceDescription {
    return this.workspaces[this.getWorkspaceIndexById(id)];
  }

  getWorkspaceProjectId(id: string): string {
    const projectId =
      this.workspaces[this.getWorkspaceIndexById(id)].gcpContext?.projectId;
    if (!projectId) {
      throw apiError(
        StatusCodes.BAD_REQUEST,
        `workspace with id ${id} does not have a GCP context`
      );
    }
    return projectId;
  }

  async getWorkspace(
    request: GetWorkspaceRequest
  ): Promise<WorkspaceDescription> {
    return Promise.resolve({
      ...this.getWorkspaceById(request.workspaceId),
      highestRole: await this.getWorkspaceHighestRole(request.workspaceId),
    });
  }

  async getWorkspaceHighestRole(workspaceId: string): Promise<IamRole> {
    const roles = await this.getRoles({ workspaceId });
    const role = roles.reduce((prevRole: IamRole | undefined, currentRole) => {
      if (
        !prevRole ||
        ALL_ROLES.indexOf(currentRole.role) > ALL_ROLES.indexOf(prevRole)
      ) {
        return currentRole.role;
      }
      return prevRole;
    }, undefined);
    if (!role) {
      throw apiError(
        StatusCodes.NOT_FOUND,
        `no roles found for workspace with id ${workspaceId}`
      );
    }
    return Promise.resolve(role);
  }

  async getWorkspaceByUserFacingId(
    request: GetWorkspaceByUserFacingIdRequest
  ): Promise<WorkspaceDescription> {
    const workspace =
      this.workspaces[
        this.getWorkspaceIndexByUserFacingId(request.workspaceUserFacingId)
      ];
    return Promise.resolve({
      ...workspace,
      highestRole: await this.getWorkspaceHighestRole(workspace.id),
    });
  }

  async createWorkspace(
    request: CreateWorkspaceRequest
  ): Promise<CreatedWorkspace> {
    const id = request.createWorkspaceRequestBody.id;
    if (!id) {
      throw apiError(StatusCodes.BAD_REQUEST, `id not provided`);
    }
    const ws: WorkspaceDescription = {
      ...request.createWorkspaceRequestBody,
      userFacingId:
        request.createWorkspaceRequestBody.userFacingId ||
        "a" + request.createWorkspaceRequestBody.id,
      highestRole: IamRole.Owner,
      policies: request.createWorkspaceRequestBody.policies?.inputs,
    };
    this.workspaces.push(ws);
    await this.grantRole({
      workspaceId: id,
      role: IamRole.Owner,
      grantRoleRequestBody: { memberEmail: TestProfile.email },
    });
    return Promise.resolve({ id: id });
  }

  async updateWorkspace(
    request: UpdateWorkspaceRequest
  ): Promise<WorkspaceDescription> {
    const index = this.getWorkspaceIndexById(request.workspaceId);
    const existing = this.getWorkspaceById(request.workspaceId);
    const updated = {
      ...existing,
      ...request.updateWorkspaceRequestBody,
    };
    this.workspaces.splice(index, 1, updated);
    return Promise.resolve(updated);
  }

  async createCloudContext(
    request: CreateCloudContextOperationRequest,
    init?: RequestInit
  ): Promise<CreateCloudContextResult> {
    const workspace = this.getWorkspaceById(request.workspaceId);
    if (!workspace.spendProfile) {
      throw apiError(
        StatusCodes.BAD_REQUEST,
        "cloud context requires a spend profile"
      );
    }

    const jobReport: JobReport = {
      id: request.createCloudContextRequest.jobControl.id,
      status: JobReportStatusEnum.Running,
      statusCode: 0,
      resultURL: "",
    };
    this.jobsApi.setJob({
      workspaceId: request.workspaceId,
      jobReport: jobReport,
      operationType: OperationType.Create,
    });

    const doCreate = () => {
      const projectId =
        projectPrefix + Math.random().toString().substring(2, 10);
      workspace.gcpContext = { projectId: projectId };
      this.googleApi.createPetServiceAccount(projectId);
      jobReport.status = JobReportStatusEnum.Succeeded;
    };

    const createTime = headerInt(init, "FAKE_CREATE_TIME") ?? 0;
    if (createTime === 0) {
      doCreate();
    } else if (createTime > 0) {
      setTimeout(doCreate, createTime);
    } else {
      // Leave incomplete for a negative time.
    }

    return Promise.resolve({ jobReport: jobReport });
  }

  async deleteWorkspace(request: DeleteWorkspaceRequest): Promise<void> {
    this.workspaces.splice(this.getWorkspaceIndexById(request.workspaceId), 1);
    return Promise.resolve();
  }

  async cloneWorkspace(
    request: CloneWorkspaceOperationRequest
  ): Promise<CloneWorkspaceResult> {
    const source = this.getWorkspaceById(request.workspaceId);

    const targetId = uuidv4();
    const projectId = projectPrefix + targetId;
    const ws: WorkspaceDescription = {
      ...request.cloneWorkspaceRequest,
      id: targetId,
      userFacingId:
        request.cloneWorkspaceRequest.userFacingId || "a" + targetId,
      highestRole: IamRole.Owner,
      gcpContext: { projectId: projectId },
    };
    this.workspaces.push(ws);
    await this.grantRole({
      workspaceId: targetId,
      role: IamRole.Owner,
      grantRoleRequestBody: { memberEmail: TestProfile.email },
    });
    this.googleApi.createPetServiceAccount(projectId);
    return Promise.resolve({
      workspace: {
        sourceWorkspaceId: source.id,
        destinationWorkspaceId: targetId,
      },
    });
  }

  async getRoles(request: GetRolesRequest): Promise<Array<RoleBinding>> {
    this.getWorkspaceById(request.workspaceId);
    const policies = await this.resourcesApi.listResourcePoliciesV2({
      resourceTypeName: "workspace",
      resourceId: request.workspaceId,
    });
    return Promise.resolve(
      policies.map((policy) => ({
        role: policy.policyName.toUpperCase() as IamRole,
        members: [...policy.policy.memberEmails],
      }))
    );
  }

  async grantRole(request: GrantRoleRequest): Promise<void> {
    await this.resourcesApi.addUserToPolicyV2({
      resourceTypeName: "workspace",
      resourceId: request.workspaceId,
      policyName: request.role.toLowerCase(),
      email: request.grantRoleRequestBody.memberEmail,
    });
  }

  async removeRole(request: RemoveRoleRequest): Promise<void> {
    await this.resourcesApi.removeUserFromPolicyV2({
      resourceTypeName: "workspace",
      resourceId: request.workspaceId,
      policyName: request.role.toLowerCase(),
      email: request.memberEmail,
    });
  }
}
