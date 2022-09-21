import { useCallback } from "react";
import { useAsync } from "react-async";
import { CloudNotebooksClient } from "../lib/cloud/notebooks";
import { useSnackbarErrorHandler } from "./errorhandler";
import { useGetPetAccessToken } from "./petServiceAccount";

interface State {
  isPending: boolean;
  run: () => void;
}
export function useStopNotebookInstance(attributes: {
  projectId: string;
  location: string;
  instanceId: string;
}): State {
  const errorHandler = useSnackbarErrorHandler();
  const petAccessToken = useGetPetAccessToken(attributes.projectId);
  const { run, isPending } = useAsync({
    deferFn: useCallback(
      () =>
        // TODO (PF-1653): add support to query the status of the operation.
        new CloudNotebooksClient(petAccessToken).stopInstance(
          attributes.projectId,
          attributes.location,
          attributes.instanceId
        ),
      [attributes, petAccessToken]
    ),
    onReject: errorHandler,
  });
  return { run: run, isPending: isPending };
}
