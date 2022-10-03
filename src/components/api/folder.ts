import { useCallback } from "react";
import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import {
  CreateFolderRequestBody,
  Folder,
} from "../../generated/workspacemanager";
import { useApi } from "../apiProvider";

export function useFolderList(
  workspaceId: string | undefined,
  config?: SWRConfiguration
) {
  const { folderApi } = useApi();
  return useSWR<Folder[]>(
    workspaceId ? key(workspaceId) : null,
    (_, workspaceId) =>
      folderApi
        .listFolders({
          workspaceId: workspaceId,
        })
        .then((l) => l.folders || []),
    config
  );
}

export function useCreateFolderAction() {
  const { folderApi } = useApi();
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspaceId: string, folder: CreateFolderRequestBody) =>
      folderApi
        .createFolder({
          workspaceId: workspaceId,
          createFolderRequestBody: folder,
        })
        .then((folder) =>
          mutate(key(workspaceId), (list: Folder[]) => {
            list?.push(folder);
            return list;
          })
        ),
    [folderApi, mutate]
  );
}

export function useFolderListReload() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspaceId: string) => mutate(key(workspaceId)),
    [mutate]
  );
}

function key(workspaceId: string) {
  return ["/api/workspace/folders", workspaceId];
}
