/*
 * A basic REST implementation of a Google Cloud Notebooks API client.
 *
 * The official client is deprecated but the NodeJS client doesn't allow us to authenticate
 * in the browser.  Ideally we should switch this out with the NodeJS client once it is
 * functional.
 */

import { useMemo } from "react";
import useSWR from "swr";
import { CloudNotebooksClient } from "../../lib/cloud/notebooks";
import { useGetPetAccessToken } from "../petServiceAccount";

export function useCloudNotebooks(projectID: string): CloudNotebooksClient {
  const getAccessToken = useGetPetAccessToken(projectID);
  return useMemo(
    () => new CloudNotebooksClient(getAccessToken),
    [getAccessToken]
  );
}

export function useCloudNotebookInstance(
  key: { projectId: string; location: string; instanceId: string } | undefined
) {
  const getAuthToken = useGetPetAccessToken(key?.projectId || "");
  return useSWR(
    key ? [key.projectId, key.location, key.instanceId] : undefined,
    (projectId, location, instanceId) => {
      return new CloudNotebooksClient(getAuthToken).getInstance(
        projectId,
        location,
        instanceId
      );
    }
  );
}
