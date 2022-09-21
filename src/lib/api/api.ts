import configuration from "../../configuration";
import { getEnvironment } from "../../environment";
import {
  Configuration as EcmConfiguration,
  SshKeyPairApi,
} from "../../generated/ecm";
import {
  Configuration as SamConfiguration,
  GoogleApi,
  ResourcesApi,
  UsersApi,
} from "../../generated/sam";
import {
  Alpha1Api,
  Configuration as WsmConfiguration,
  ControlledGcpResourceApi,
  FolderApi,
  JobsApi,
  ReferencedGcpResourceApi,
  ResourceApi,
  WorkspaceApi,
} from "../../generated/workspacemanager";
import { addErrorTranslator } from "./error";

export function createApis(getAuthToken: () => Promise<string>, env?: string) {
  if (!env) {
    env = getApiEnv();
  }

  const wsmConfig = new WsmConfiguration({
    basePath: serviceUri("wsm", env),
    accessToken: getAuthToken,
  });
  const samConfig = new SamConfiguration({
    basePath: serviceUri("sam", env),
    accessToken: async () =>
      !getAuthToken ? "" : "Bearer " + (await getAuthToken()),
  });
  const ecmConfig = new EcmConfiguration({
    basePath: serviceUri("ecm", env),
    accessToken: getAuthToken,
  });

  const apis = {
    workspaceApi: new WorkspaceApi(wsmConfig),
    resourceApi: new ResourceApi(wsmConfig),
    controlledGcpResourceApi: new ControlledGcpResourceApi(wsmConfig),
    referencedGcpResourceApi: new ReferencedGcpResourceApi(wsmConfig),
    jobsApi: new JobsApi(wsmConfig),
    folderApi: new FolderApi(wsmConfig),
    alpha1Api: new Alpha1Api(wsmConfig),
    usersApi: new UsersApi(samConfig),
    googleApi: new GoogleApi(samConfig),
    resourcesApi: new ResourcesApi(samConfig),
    sshKeyPairApi: new SshKeyPairApi(ecmConfig),
  };
  addErrorTranslator(Object.values(apis));
  return apis;
}

function serviceUri(service: string, env: string): string {
  const expand = (pattern: string): string =>
    pattern.replace("${service}", service).replace("${env}", env);
  if (env in configuration.backendUris) {
    return expand(configuration.backendUris[env]);
  }
  return expand(configuration.backendUris["*"]);
}

function getApiEnv() {
  return getEnvironment().REACT_APP_API_ENVIRONMENT || "devel";
}
