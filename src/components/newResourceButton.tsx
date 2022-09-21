import { Button, Icon, Menu, MenuItem } from "@mui/material";
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import { ReactElement } from "react";
import { WorkspaceDescription } from "../generated/workspacemanager";
import { useCreateBigQueryDataset } from "./createBigQueryDataset";
import { useCreateBucket } from "./createBucket";

interface NewResourceButtonProps {
  workspace: WorkspaceDescription;
}

export function NewResourceButton({
  workspace,
}: NewResourceButtonProps): ReactElement {
  const { createBucket, show: showBucket } = useCreateBucket({
    workspace: workspace,
  });
  const { createBigQueryDataset, show: showBigQueryDataset } =
    useCreateBigQueryDataset({
      workspace: workspace,
    });

  const menuState = usePopupState({
    variant: "popover",
    popupId: "new-resource-menu",
  });

  return (
    <div>
      <Button
        variant="contained"
        startIcon={<Icon>add</Icon>}
        {...bindTrigger(menuState)}
      >
        New
      </Button>
      <Menu onClick={menuState.close} {...bindMenu(menuState)}>
        <MenuItem onClick={showBucket}>Cloud Storage bucket</MenuItem>
        <MenuItem onClick={showBigQueryDataset}>BigQuery dataset</MenuItem>
      </Menu>
      {createBucket}
      {createBigQueryDataset}
    </div>
  );
}
