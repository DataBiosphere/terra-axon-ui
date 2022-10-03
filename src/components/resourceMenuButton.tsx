import {
  CircularProgress,
  Icon,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import { useDeleteResource } from "../components/deleteResource";
import { LoadingBackdrop } from "../components/loadingBackdrop";
import {
  EnumeratedJob,
  ResourceDescription,
} from "../generated/workspacemanager";

interface ResourceMenuButtonProps {
  resource: ResourceDescription;
  onDelete?: () => void;
  job?: EnumeratedJob;
}

export function ResourceMenuButton({
  resource,
  job,
  onDelete = () => null,
}: ResourceMenuButtonProps) {
  const deleteResource = useDeleteResource(resource);
  const menuState = usePopupState({
    variant: "popover",
    popupId: `resource-menu-${resource.metadata?.resourceId}`,
  });

  return job ? (
    <CircularProgress color="primary" size={20} sx={{ m: 1 }} />
  ) : (
    <div>
      <IconButton size="small" {...bindTrigger(menuState)}>
        <Icon>more_vert</Icon>
      </IconButton>
      <LoadingBackdrop open={deleteResource.isPending} />
      <Menu onClick={menuState.close} {...bindMenu(menuState)}>
        <MenuItem
          onClick={() => {
            onDelete();
            deleteResource.run();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}
