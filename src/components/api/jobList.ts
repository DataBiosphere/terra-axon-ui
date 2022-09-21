import { useCallback } from "react";
import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import {
  EnumeratedJob,
  JobStateFilter,
} from "../../generated/workspacemanager";
import { useApi } from "../apiProvider";

export function useJobList(
  workspaceId: string | undefined,
  config?: SWRConfiguration
) {
  const { alpha1Api } = useApi();
  return useSWR<EnumeratedJob[]>(
    workspaceId ? key(workspaceId) : null,
    (_, workspaceId) =>
      alpha1Api
        .enumerateJobs({
          workspaceId: workspaceId,
          jobState: JobStateFilter.Active,
          // TODO(PF-1491): Properly handle pagination.
          limit: 1000,
        })
        .then((l) => l.results || []),
    config
  );
}

export function useJobAdded() {
  const { mutate } = useSWRConfig();
  return useCallback(
    (workspaceId: string) => mutate(key(workspaceId)),
    [mutate]
  );
}

function key(workspaceId: string) {
  return ["/api/workspace/jobs", workspaceId];
}
