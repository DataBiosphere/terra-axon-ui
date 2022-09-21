import { addErrorTranslator } from "../../lib/api/error";
import { CloudNotebooksClient } from "../../lib/cloud/notebooks";
import { FakeSshKeyPairApi } from "./ecm/sshKeyPair";
import { FakeGoogleApi } from "./sam/google";
import { FakeResourcesApi } from "./sam/resources";
import { FakeUsersApi } from "./sam/users";
import { FakeAlpha1Api } from "./wsm/alpha1";
import { FakeControlledGcpResourceApi } from "./wsm/controlledGcpResource";
import { FakeFolderApi } from "./wsm/folder";
import { FakeJobsApi } from "./wsm/jobs";
import { FakeReferencedGcpResourceApi } from "./wsm/referencedGcpResource";
import { FakeResourceApi } from "./wsm/resource";
import { FakeWorkspaceApi } from "./wsm/workspaceApi";

export type ApiFakes = ReturnType<typeof apiFakes>;

export interface ApiFakesOptions {
  notebooksApi: CloudNotebooksClient;
}

export function apiFakes(
  opts: ApiFakesOptions = {
    notebooksApi: new CloudNotebooksClient(),
  }
) {
  const googleApi = new FakeGoogleApi();
  const resourcesApi = new FakeResourcesApi();
  const jobsApi = new FakeJobsApi();
  const workspaceApi = new FakeWorkspaceApi(jobsApi, googleApi, resourcesApi);
  const resourceApi = new FakeResourceApi(workspaceApi);
  const apis = {
    workspaceApi: workspaceApi,
    resourceApi: resourceApi,
    controlledGcpResourceApi: new FakeControlledGcpResourceApi(
      resourceApi,
      workspaceApi,
      opts.notebooksApi
    ),
    referencedGcpResourceApi: new FakeReferencedGcpResourceApi(resourceApi),
    folderApi: new FakeFolderApi(),
    jobsApi: jobsApi,
    alpha1Api: new FakeAlpha1Api(jobsApi),
    usersApi: new FakeUsersApi(),
    googleApi: googleApi,
    resourcesApi: resourcesApi,
    sshKeyPairApi: new FakeSshKeyPairApi(),
  };
  addErrorTranslator(Object.values(apis));
  return apis;
}
