import {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useState,
} from "react";
import { SshKeyPairApi } from "../generated/ecm";
import { GoogleApi, ResourcesApi, UsersApi } from "../generated/sam";
import {
  Alpha1Api,
  ControlledGcpResourceApi,
  FolderApi,
  JobsApi,
  ReferencedGcpResourceApi,
  ResourceApi,
  WorkspaceApi,
} from "../generated/workspacemanager";
import { createApis } from "../lib/api/api";
import { useAuth } from "./auth";

export type ApiContextType = {
  workspaceApi: WorkspaceApi;
  resourceApi: ResourceApi;
  controlledGcpResourceApi: ControlledGcpResourceApi;
  referencedGcpResourceApi: ReferencedGcpResourceApi;
  folderApi: FolderApi;
  jobsApi: JobsApi;
  alpha1Api: Alpha1Api;
  usersApi: UsersApi;
  googleApi: GoogleApi;
  resourcesApi: ResourcesApi;
  sshKeyPairApi: SshKeyPairApi;
};

export const ApiContext = createContext<ApiContextType>({} as ApiContextType);

export function useApi(): ApiContextType {
  return useContext(ApiContext);
}

export interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps): ReactElement {
  const { getAuthToken } = useAuth();
  // Permanently set value, which is safe as getAuthToken never changes.
  const [value] = useState(() => createApis(getAuthToken));
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
