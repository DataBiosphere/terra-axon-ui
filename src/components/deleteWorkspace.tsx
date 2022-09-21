import { MenuItem, MenuItemProps } from "@mui/material";
import { useCallback } from "react";
import { useAsync } from "react-async";
import { useHistory } from "react-router-dom";
import { IamRole, WorkspaceDescription } from "../generated/workspacemanager";
import { useWorkspaceDeleted } from "./api/workspace";
import { useApi } from "./apiProvider";
import { DisabledTooltip } from "./disabledTooltip";
import { useSnackbarErrorHandler } from "./errorhandler";
import { roleContains } from "./iamRole";

interface State {
  run: () => void;
  isPending: boolean;
}

export function useDeleteWorkspace(workspace: WorkspaceDescription): State {
  const history = useHistory();
  const { workspaceApi } = useApi();
  const errorHandler = useSnackbarErrorHandler();
  const workspaceDeleted = useWorkspaceDeleted();

  const { run, isPending } = useAsync<void>({
    deferFn: useCallback(
      () => workspaceApi.deleteWorkspace({ workspaceId: workspace.id }),
      [workspaceApi, workspace]
    ),
    body: workspace,
    onResolve: () => {
      workspaceDeleted(workspace);
      history.push({ pathname: "/workspaces" });
    },
    onReject: errorHandler,
  });

  return { run: run, isPending: isPending };
}

export interface DeleteWorkspaceMenuItemProps extends MenuItemProps {
  workspace: WorkspaceDescription;
}

export function DeleteWorkspaceMenuItem({
  workspace,
  ...props
}: DeleteWorkspaceMenuItemProps) {
  const iamRole = workspace.highestRole;
  return (
    <DisabledTooltip title="You must be an Owner to delete a workspace">
      <MenuItem disabled={!roleContains(iamRole, IamRole.Owner)} {...props}>
        Delete
      </MenuItem>
    </DisabledTooltip>
  );
}
