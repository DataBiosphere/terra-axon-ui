import {
  CloudPlatform,
  CreateWorkspaceRequestBody,
  WorkspaceDescription,
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
