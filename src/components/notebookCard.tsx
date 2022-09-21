import {
  Box,
  CircularProgress,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import React from "react";
import {
  EnumeratedJob,
  GcpAiNotebookInstanceAttributes,
  ResourceDescription,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { Instance } from "../lib/cloud/notebooks";
import { useCloudNotebookInstance } from "./cloud/notebooks";
import { CopyToClipboardButton } from "./copyToClipboardButton";
import { useDeleteResource } from "./deleteResource";
import {
  EditNotebookInstance,
  useEditNotebookState,
} from "./editNotebookInstance";
import { errorMessage } from "./errorhandler";
import { bindFlyover } from "./flyover";
import { LoadingBackdrop } from "./loadingBackdrop";
import { useStartNotebookInstance } from "./startNotebookInstance";
import { useStopNotebookInstance } from "./stopNotebookInstance";
interface NotebookCardProps {
  workspace: WorkspaceDescription;
  notebook: ResourceDescription;
  job?: EnumeratedJob;
}

export const getIdFromNameString = (name: string) => {
  return name.substring(name.lastIndexOf("/") + 1);
};

export function NotebookCard({ workspace, notebook, job }: NotebookCardProps) {
  const metadata = notebook.metadata;
  const attributes = notebook.resourceAttributes
    .gcpAiNotebookInstance as GcpAiNotebookInstanceAttributes;

  const { data: instance, error } = useCloudNotebookInstance(
    job ? undefined : attributes // Don't query GCP while a job is in progress.
  );

  const theme = useTheme();
  const repository = instance?.containerImage?.repository;
  const tag = instance?.containerImage?.tag;

  return (
    <Paper sx={{ p: 3 }} data-testid="notebook-card">
      <Box display="flex" alignItems="flex-start">
        <Box display="flex" flexGrow={1} alignItems="center">
          {/* Render name and icon as link if instance uri exists, o.w. just name */}
          {instance?.name && instance?.proxyUri ? (
            <Link
              href={"https://" + instance.proxyUri}
              underline="none"
              target="_blank"
            >
              <Box display="flex" alignItems="center">
                <Typography
                  variant="h2"
                  sx={{
                    color: theme.palette.primary.main,
                    fontSize: 22,
                    fontWeight: 400,
                    mr: 1,
                  }}
                  display="inline"
                >
                  {metadata.name}
                </Typography>
                <IconButton size="small">
                  <Icon sx={{ color: theme.palette.primary.main }}>launch</Icon>
                </IconButton>
              </Box>
            </Link>
          ) : (
            <Typography
              variant="h2"
              sx={{
                color: theme.palette.primary.main,
                fontSize: 22,
                fontWeight: 400,
                mr: 1,
              }}
              display="inline"
            >
              {metadata.name}
            </Typography>
          )}
          <NotebookStateChip state={instance?.state} error={error} />
        </Box>
        <Box>
          <NotebookMenuButton
            workspace={workspace}
            resource={notebook}
            job={job}
            notebookAttributes={attributes}
            instance={instance}
          />
        </Box>
      </Box>
      <Box display="flex" mb={2}>
        <Typography display="span" color="grey.700" mr={1}>
          Cloud Instance Name:
        </Typography>
        <Typography display="span" color="grey.700" fontWeight={600} mr={4}>
          {notebook.resourceAttributes.gcpAiNotebookInstance?.instanceId || "-"}
        </Typography>
        <Typography display="span" color="grey.700" mr={1}>
          Opens:
        </Typography>
        <Typography display="span" color="grey.700" fontWeight={600} mr={4}>
          JupyterLab
        </Typography>
        <Box display="flex">
          <Typography display="span" color="grey.700" mr={1}>
            Docker Image:
          </Typography>
          <Typography
            display="span"
            color="grey.70"
            fontWeight={600}
            mr={1}
            noWrap={true}
            sx={{ maxWidth: "200px" }}
          >
            {getIdFromNameString(repository || "-")}
          </Typography>
          <Box mt={-0.75}>
            {repository && (
              <>
                <Tooltip
                  title={<span>{repository + (tag ? ":" + tag : "")}</span>}
                >
                  <CopyToClipboardButtonWithTooltip
                    value={repository + (tag ? ":" + tag : "")}
                  />
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Box>
      {metadata.description && ( // only display description header if non empty
        <>
          <Typography flexGrow={1} color="grey.700" mb={-1}>
            Description
          </Typography>
          <p>{metadata.description}</p>
        </>
      )}
    </Paper>
  );
}

interface CopyToClipboardButtonWithTooltipProps {
  value: string;
}

const CopyToClipboardButtonWithTooltip = React.forwardRef(
  function CopyToClipboardButtonWithTooltip(
    props: CopyToClipboardButtonWithTooltipProps,
    ref
  ) {
    return (
      <Box {...props} ref={ref} role="button" aria-label="vmimage">
        <CopyToClipboardButton value={props.value} />
      </Box>
    );
  }
);

interface NotebookStateChipProps {
  state?: string;
  error?: Error;
}

function NotebookStateChip({ state, error }: NotebookStateChipProps) {
  if (error) {
    state = "ERROR";
  }
  if (!state) return null;

  let color = "#5F6368";
  let backgroundColor: string | undefined;
  switch (state) {
    case "ACTIVE":
      color = "#1E8E3E";
      backgroundColor = "#E6F4EA";
      state = "RUNNING"; // override state for text display
      break;
    case "PROVISIONING":
      color = "#636363";
      backgroundColor = "#ebebeb";
      break;
    case "STOPPING":
      color = "#636363";
      backgroundColor = "#ebebeb";
      break;
    case "ERROR":
    case "STOPPED":
    case "DELETED":
      color = "#8C1D18";
      backgroundColor = "#FCEEEE";
      break;
  }
  const chip = (
    <Box
      display="inline"
      sx={{
        marginLeft: "6px",
        borderRadius: "4px",
        fontSize: 12,
        height: 24,
        fontWeight: "bold",
        letterSpacing: 1,
        color: color,
        backgroundColor: backgroundColor,
        px: 1.5,
        py: 0.5,
      }}
    >
      {state}
    </Box>
  );

  return error ? <Tooltip title={errorMessage(error)}>{chip}</Tooltip> : chip;
}

interface NotebookMenuButtonProps {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
  job?: EnumeratedJob;
  notebookAttributes: GcpAiNotebookInstanceAttributes;
  instance?: Instance;
}

function NotebookMenuButton({
  workspace,
  resource,
  job,
  notebookAttributes,
  instance,
}: NotebookMenuButtonProps) {
  const { isPending: deleteResourceIsPending, run: deleteResource } =
    useDeleteResource(resource);
  const { isPending: stopNotebookIsPending, run: stopNotebook } =
    useStopNotebookInstance(notebookAttributes);
  const { isPending: startNotebookIsPending, run: startNotebook } =
    useStartNotebookInstance(notebookAttributes);
  const editNotebookState = useEditNotebookState(resource);
  const state = instance?.state;

  const menuState = usePopupState({
    variant: "popover",
    popupId: `notebook-menu-${resource.metadata.resourceId}`,
  });

  return job ? (
    <CircularProgress color="primary" size={20} sx={{ m: 1 }} />
  ) : (
    <div>
      <IconButton size="small" aria-label="menu" {...bindTrigger(menuState)}>
        <Icon>more_vert</Icon>
      </IconButton>
      <LoadingBackdrop
        open={
          deleteResourceIsPending ||
          stopNotebookIsPending ||
          startNotebookIsPending
        }
      />
      <Menu onClick={menuState.close} {...bindMenu(menuState)}>
        <MenuItem {...bindTrigger(editNotebookState)}>Edit</MenuItem>
        {state && state == "ACTIVE" && (
          <MenuItem onClick={stopNotebook}>Stop</MenuItem>
        )}
        {state && state == "STOPPED" && (
          <MenuItem onClick={startNotebook}>Start</MenuItem>
        )}
        <MenuItem onClick={deleteResource}>Delete</MenuItem>
      </Menu>
      <EditNotebookInstance
        workspace={workspace}
        resource={resource}
        instance={instance}
        {...bindFlyover(editNotebookState)}
      />
    </div>
  );
}
