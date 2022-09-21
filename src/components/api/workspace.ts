import { useCallback } from "react";
import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import { useApi } from "../../components/apiProvider";
import {
  IamRole,
  WorkspaceDescription,
} from "../../generated/workspacemanager";

export function useWorkspaceList(config?: SWRConfiguration) {
  const { workspaceApi } = useApi();
  return useSWR<WorkspaceDescription[]>(
    workspacesKey,
    () =>
      workspaceApi.listWorkspaces({ limit: 1000 }).then((res) =>
        res.workspaces.filter(
          (ws) =>
            // Filter out data collections which are stored as workspaces.
            // As a temporary exception, allow Owners and Writers to still see as
            // workspaces until we have defined how Data Stewards should manage these.
            !isDataCollection(ws) ||
            ws.highestRole == (IamRole.Owner || IamRole.Writer)
        )
      ),
    config
  );
}

export function useDataCollectionList(config?: SWRConfiguration) {
  const { workspaceApi } = useApi();
  return useSWR<WorkspaceDescription[]>(
    "/api/dataCollections",
    () =>
      workspaceApi
        .listWorkspaces({ minimumHighestRole: IamRole.Discoverer, limit: 1000 })
        .then((res) => res.workspaces.filter((ws) => isDataCollection(ws))),
    config
  );
}

export function useWorkspace(
  workspaceUserFacingId: string,
  config?: SWRConfiguration
) {
  const { workspaceApi } = useApi();
  return useSWR<WorkspaceDescription>(
    key(workspaceUserFacingId),
    (_, workspaceUserFacingId) =>
      workspaceApi.getWorkspaceByUserFacingId({
        workspaceUserFacingId: workspaceUserFacingId,
      }),
    config
  );
}

export function useWorkspaceUpdated() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspace?: WorkspaceDescription) => {
      if (workspace) {
        mutate(key(workspace.userFacingId), workspace);
        mutate(workspacesKey, (list: WorkspaceDescription[]) =>
          list?.map((ws) => (ws.id !== workspace.id ? ws : workspace))
        );
      } else {
        mutate(workspacesKey); // Invalidate the whole list.
      }
    },
    [mutate]
  );
}

export function useWorkspaceAdded() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspace?: WorkspaceDescription) => {
      if (workspace) {
        mutate(workspacesKey, (list: WorkspaceDescription[]) => {
          const newList = list || [];
          newList.push(workspace);
          return list;
        });
      } else {
        mutate(workspacesKey); // Invalidate the whole list.
      }
    },
    [mutate]
  );
}

export function useWorkspaceDeleted() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspace?: WorkspaceDescription) => {
      if (workspace) {
        mutate(workspacesKey, (list: WorkspaceDescription[]) =>
          list?.filter((ws) => ws.id !== workspace.id)
        );
        mutate(key(workspace.userFacingId), undefined, false);
      } else {
        mutate(workspacesKey); // Invalidate the whole list.
      }
    },
    [mutate]
  );
}

function key(workspaceUserFacingId: string) {
  return ["/api/workspace", workspaceUserFacingId];
}

const workspacesKey = "/api/workspaces";

function isDataCollection(ws: WorkspaceDescription) {
  return ws.properties?.find(
    (p) => p.key == "terra-type" && p.value == "data-collection"
  );
}
