import {
  Box,
  Divider,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import { ReactElement } from "react";
import { Link as RouterLink } from "react-router-dom";
import { AbsoluteDateTooltip } from "../components/absoluteDateTooltip";
import { ActionsCell } from "../components/actionsCell";
import { useWorkspaceList } from "../components/api/workspace";
import { useCloneWorkspaceResourceLoad } from "../components/cloneWorkspace";
import { CreateWorkspaceButton } from "../components/createWorkspaceButton";
import {
  DeleteWorkspaceMenuItem,
  useDeleteWorkspace,
} from "../components/deleteWorkspace";
import { useDeleteWorkspaceDialog } from "../components/deleteWorkspaceDialog";
import { DisabledTooltip } from "../components/disabledTooltip";
import { EmptyCard } from "../components/emptyCard";
import { usePageErrorHandler } from "../components/errorhandler";
import { ALL_ROLES, roleContains } from "../components/iamRole";
import { lastModifiedToString } from "../components/lastModified";
import { Loading } from "../components/loading";
import { LoadingBackdrop } from "../components/loadingBackdrop";
import { NoWrapCell } from "../components/noWrapCell";
import { NoWrapTypography } from "../components/noWrapTypography";
import { OverflowTooltip } from "../components/overflowTooltip";
import { PageContent, PageContentCard } from "../components/pageContent";
import { PageTitle } from "../components/pageTitle";
import { useShareWorkspace } from "../components/shareWorkspace";
import { useTitlePrefix } from "../components/title";
import { useUserIdentity } from "../components/useUserIdentity";
import {
  getWorkspaceComparator,
  workspaceAccessLevelComparator,
  workspaceNameDescriptionComparator,
  WorkspaceTableControl,
  WorkspaceTableCount,
  WorkspaceTableSearchFilter,
  WorkspaceTableSortField,
} from "../components/workspaceTableControl";
import { IamRole, WorkspaceDescription } from "../generated/workspacemanager";

export default function WorkspacesPage(): ReactElement {
  useTitlePrefix("Workspaces");
  const errorHandler = usePageErrorHandler();

  const { data: workspaces } = useWorkspaceList({ onError: errorHandler });

  if (workspaces === undefined) {
    return <Loading />;
  }
  return (
    <div>
      <PageTitle
        title="Workspaces"
        backTo="/"
        backText="Home"
        actions={<CreateWorkspaceButton variant="contained" />}
      />
      {workspaces.length ? (
        <PageContent>
          <WorkspacesTable workspaces={workspaces} />
        </PageContent>
      ) : (
        <PageContentCard>
          <EmptyCard
            primary="No workspaces yet"
            secondary="Add a new workspace to get started with your analysis."
            action={<CreateWorkspaceButton variant="outlined" />}
          />
        </PageContentCard>
      )}
    </div>
  );
}

interface WorkspaceMenuButtonProps {
  workspace: WorkspaceDescription;
}
function WorkspaceMenuButton({ workspace }: WorkspaceMenuButtonProps) {
  const { run: deleteWorkspace, isPending: deletePending } =
    useDeleteWorkspace(workspace);
  const { cloneWorkspace: cloneWorkspace, run: showCloneWorkspace } =
    useCloneWorkspaceResourceLoad({ workspace });

  const { shareWorkspace, show: showShareWorkspace } = useShareWorkspace({
    workspace,
  });

  const { deleteWorkspaceDialog, show: showDeleteDialog } =
    useDeleteWorkspaceDialog({
      workspace,
      run: deleteWorkspace,
    });

  const iamRole = workspace.highestRole;

  const menuState = usePopupState({
    variant: "popover",
    popupId: `workspace-menu-${workspace.id}`,
  });

  return (
    <div>
      <IconButton {...bindTrigger(menuState)}>
        <Icon>more_vert</Icon>
      </IconButton>
      <Menu onClick={menuState.close} {...bindMenu(menuState)}>
        <MenuList sx={{ p: 0 }}>
          <MenuItem onClick={showCloneWorkspace}>Duplicate</MenuItem>
          {
            // TODO (PF-1769): The disabled tooltip <span> causes styling issues.
            // This might have to do with the list formatting.
          }
          <DisabledTooltip title="You must be an Owner to share a workspace">
            <MenuItem
              onClick={showShareWorkspace}
              disabled={!roleContains(iamRole, IamRole.Owner)}
            >
              Share
            </MenuItem>
          </DisabledTooltip>
          <Divider sx={{ my: 1 }} />
          <Box>
            <DeleteWorkspaceMenuItem
              workspace={workspace}
              onClick={showDeleteDialog}
            />
          </Box>
        </MenuList>
      </Menu>
      {deleteWorkspaceDialog}
      {cloneWorkspace}
      {shareWorkspace}
      <LoadingBackdrop open={deletePending} />
    </div>
  );
}

interface WorkspacesTableProps {
  workspaces: WorkspaceDescription[];
}

function WorkspacesTable(props: WorkspacesTableProps) {
  const { workspaces } = props;

  const theme = useTheme();
  const userIdentity = useUserIdentity();

  return (
    <WorkspaceTableControl workspaces={workspaces}>
      {({ sortedWorkspaces }) => (
        <div>
          <WorkspaceTableCount workspaces={workspaces} />
          <Box
            sx={{
              border: 1,
              // Remove double border between table header and search bar
              borderBottomWidth: 0,
              // Match border color of table cells
              borderColor: theme.palette.grey[300],
              bgcolor: "table.head",
            }}
          >
            <WorkspaceTableSearchFilter />
          </Box>
          <TableContainer component={Paper} variant="outlined" square>
            <Table width="100%" sx={{ tableLayout: "fixed" }}>
              <TableHead sx={{ bgcolor: "table.head" }}>
                <TableRow>
                  <TableCell width="42.5%">
                    <WorkspaceTableSortField
                      label="Name"
                      comparator={workspaceNameDescriptionComparator}
                    />
                  </TableCell>
                  <TableCell width="17.5%">
                    <WorkspaceTableSortField
                      label="Last modified"
                      comparator={workspaceAccessLevelComparator}
                    />
                  </TableCell>
                  <TableCell width="17.5%">
                    <WorkspaceTableSortField
                      label="Created by"
                      comparator={getWorkspaceComparator("createdBy")}
                    />
                  </TableCell>
                  <TableCell width="17.5%">
                    <WorkspaceTableSortField
                      label="Access level"
                      comparator={(a, b) => {
                        return (
                          ALL_ROLES.indexOf(a.highestRole) -
                          ALL_ROLES.indexOf(b.highestRole)
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell width="5%" />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedWorkspaces.map((workspace) => (
                  <TableRow key={workspace.id}>
                    <NoWrapCell>
                      <Box>
                        <OverflowTooltip
                          title={workspace.displayName || workspace.id}
                        >
                          <Link
                            component={RouterLink}
                            variant="body2"
                            to={"/workspaces/" + workspace.userFacingId}
                            underline="none"
                            sx={{
                              color: "table.primary",
                              ":hover": { color: theme.palette.primary.main },
                            }}
                          >
                            {workspace.displayName || workspace.id}
                          </Link>
                        </OverflowTooltip>
                      </Box>
                      <NoWrapTypography
                        sx={{ fontSize: 12, color: "table.secondary" }}
                      >
                        {workspace.description || "--"}
                      </NoWrapTypography>
                    </NoWrapCell>
                    <NoWrapCell sx={{ color: "table.secondary" }}>
                      <Box>
                        <AbsoluteDateTooltip date={workspace.lastUpdatedDate}>
                          {lastModifiedToString(workspace.lastUpdatedDate) ||
                            "--"}
                        </AbsoluteDateTooltip>
                      </Box>
                      {workspace.lastUpdatedBy && (
                        <OverflowTooltip
                          title={`By ${userIdentity(workspace.lastUpdatedBy)}`}
                          boxProps={{ sx: { fontSize: 12 } }}
                        />
                      )}
                    </NoWrapCell>
                    <NoWrapCell sx={{ color: "table.secondary" }}>
                      <OverflowTooltip
                        title={userIdentity(workspace.createdBy) || "--"}
                      />
                    </NoWrapCell>
                    <NoWrapCell sx={{ color: "table.secondary" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {workspace.highestRole === IamRole.Owner && (
                          <Icon>person_outline</Icon>
                        )}
                        <OverflowTooltip
                          title={
                            workspace.highestRole.charAt(0) +
                            workspace.highestRole.slice(1).toLowerCase()
                          }
                        />
                      </Box>
                    </NoWrapCell>
                    <ActionsCell size="small">
                      <WorkspaceMenuButton workspace={workspace} />
                    </ActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sortedWorkspaces.length <= 0 && (
              <PageContent>
                <EmptyCard
                  primary="No results found"
                  secondary="Try clearing some filters"
                />
              </PageContent>
            )}
          </TableContainer>
        </div>
      )}
    </WorkspaceTableControl>
  );
}
