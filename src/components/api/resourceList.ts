import { useCallback } from "react";
import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import {
  AccessScope,
  ResourceDescription,
  StewardshipType,
} from "../../generated/workspacemanager";
import { useApi } from "../apiProvider";
import { useAuth } from "../auth";

export function useIsAccessibleResource() {
  const { profile } = useAuth();
  const email = profile?.email || "";
  return useCallback(
    (r: ResourceDescription) =>
      r.metadata.stewardshipType === StewardshipType.Referenced ||
      r.metadata.controlledResourceMetadata?.accessScope ===
        AccessScope.SharedAccess ||
      (!!email &&
        email ===
          r.metadata.controlledResourceMetadata?.privateResourceUser?.userName),
    [email]
  );
}

export function useResourceList(
  workspaceId: string | undefined,
  config?: SWRConfiguration
) {
  const { resourceApi } = useApi();

  const isAccessibleResource = useIsAccessibleResource();

  return useSWR<ResourceDescription[]>(
    workspaceId ? key(workspaceId) : null,
    (_, workspaceId) =>
      resourceApi
        .enumerateResources({ workspaceId: workspaceId, limit: 1000 })
        .then((l) => l.resources.filter(isAccessibleResource)),
    config
  );
}

export function useResourceListReload() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspaceId: string) => mutate(key(workspaceId)),
    [mutate]
  );
}

export function useResourceUpdated() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (resource: ResourceDescription) => {
      mutate(
        key(resource.metadata.workspaceId),
        (list: ResourceDescription[]) =>
          list?.map((r) =>
            r.metadata.resourceId !== resource.metadata.resourceId
              ? r
              : resource
          )
      );
      mutate(workspaceKey(resource.metadata.workspaceId));
    },
    [mutate]
  );
}

export function useResourceAdded() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (resource: ResourceDescription) => {
      mutate(
        key(resource.metadata.workspaceId),
        (list: ResourceDescription[]) => {
          list?.push(resource);
          return list;
        }
      );
      mutate(workspaceKey(resource.metadata.workspaceId));
    },
    [mutate]
  );
}

export function useResourceDeleted() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (resource: ResourceDescription) => {
      mutate(
        key(resource.metadata.workspaceId),
        (list: ResourceDescription[]) =>
          list?.filter(
            (r) => r.metadata.resourceId !== resource.metadata.resourceId
          )
      );
      mutate(workspaceKey(resource.metadata.workspaceId));
    },
    [mutate]
  );
}

function key(workspaceId: string) {
  return ["/api/workspace/resources", workspaceId];
}

function workspaceKey(workspaceUserFacingId: string) {
  return ["/api/workspace", workspaceUserFacingId];
}
