import { v4 as uuidv4 } from "uuid";
import {
  CloudPlatform,
  CreateWorkspaceRequestBody,
  WorkspaceDescription,
  WorkspaceStageModel,
} from "../../generated/workspacemanager";
import { ApiFakes } from "./fakes";

export async function createTestWorkspace(
  { workspaceApi }: ApiFakes,
  params?: Partial<CreateWorkspaceRequestBody>
): Promise<WorkspaceDescription> {
  const created = await workspaceApi.createWorkspace({
    createWorkspaceRequestBody: {
      ...params,
      id: params?.id || "test-id",
      displayName: params?.displayName || "test name",
      userFacingId: params?.userFacingId || "test-ufid",
      spendProfile: params?.spendProfile || "test-spend-profile",
    },
  });
  await workspaceApi.createCloudContext({
    workspaceId: created.id,
    createCloudContextRequest: {
      cloudPlatform: CloudPlatform.Gcp,
      jobControl: { id: "test-job-id" },
    },
  });
  return workspaceApi.getWorkspaceById(created.id);
}

export async function createTestDataCollection(
  { workspaceApi }: ApiFakes,
  params?: Partial<CreateWorkspaceRequestBody>
): Promise<WorkspaceDescription> {
  const id = uuidv4();
  const suffix = Math.random().toString().substring(2, 10);
  const created = await workspaceApi.createWorkspace({
    createWorkspaceRequestBody: {
      ...params,
      id: params?.id || id,
      displayName: params?.displayName || "test-data-collection-name" + suffix,
      stage: WorkspaceStageModel.McWorkspace,
      userFacingId: params?.userFacingId || "test-data-collection-id-" + suffix,
      spendProfile: params?.spendProfile || "test-spend-profile",
      properties: [{ key: "terra-type", value: "data-collection" }],
    },
  });

  return workspaceApi.getWorkspaceById(created.id);
}
