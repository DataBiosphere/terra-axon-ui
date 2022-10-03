import { useEffect } from "react";
import { createLocalStorageStateHook } from "use-local-storage-state";
import { WorkspaceDescription } from "../generated/workspacemanager";

export function useRecentWorkspaces(
  workspaces: WorkspaceDescription[] | undefined
) {
  const [recentWorkspaces, setRecentWorkspaces] = useRecentWorkspacesStorage();

  if (!workspaces || !recentWorkspaces) {
    return [];
  }

  let dirty = false;
  const alive = [];
  for (const wsId of recentWorkspaces) {
    const workspaceInfo = workspaces.find((candidate) => candidate.id === wsId);
    if (workspaceInfo) {
      alive.push(workspaceInfo);
    } else {
      dirty = true;
    }
  }

  if (dirty) {
    setRecentWorkspaces(alive.map((ws) => ws.id));
  }

  return alive;
}

export function useRecentWorkspacesRecord(workspaceId: string | undefined) {
  const [, setRecentWorkspaces] = useRecentWorkspacesStorage();

  useEffect(() => {
    if (workspaceId) {
      setRecentWorkspaces((prevRecentWorkspaces) =>
        prevRecentWorkspaces?.at(0) !== workspaceId
          ? [workspaceId].concat(
              prevRecentWorkspaces
                ?.filter((ws) => ws !== workspaceId)
                .slice(0, 9) || []
            )
          : prevRecentWorkspaces
      );
    }
  }, [setRecentWorkspaces, workspaceId]);
}

const useRecentWorkspacesStorage =
  createLocalStorageStateHook<string[]>("recentWorkspaces");
