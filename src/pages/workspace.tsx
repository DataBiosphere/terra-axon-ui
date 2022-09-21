import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Icon,
  IconButton,
  LinearProgress,
  Link,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  bindMenu,
  bindTrigger,
  PopupState,
  usePopupState,
} from "material-ui-popup-state/hooks";
import {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { AbsoluteDateTooltip } from "../components/absoluteDateTooltip";
import { useAddFromDataCollection } from "../components/addFromDataCollection";
import { useJobList } from "../components/api/jobList";
import { useResourceList } from "../components/api/resourceList";
import { useWorkspace } from "../components/api/workspace";
import { useCloneWorkspace } from "../components/cloneWorkspace";
import { CopyToClipboardButton } from "../components/copyToClipboardButton";
import { useCreateBigQueryDatasetReference } from "../components/createBigQueryDatasetReference";
import { useCreateBigQueryDataTableReference } from "../components/createBigQueryDataTableReference";
import { useCreateBucketReference } from "../components/createBucketReference";
import { useCreateGitRepoReference } from "../components/createGitRepoReference";
import { useCreateNotebookInstance } from "../components/createNotebookInstance";
import { useCreateObjectReference } from "../components/createObjectReference";
import { useDeleteResource } from "../components/deleteResource";
import {
  DeleteWorkspaceMenuItem,
  useDeleteWorkspace,
} from "../components/deleteWorkspace";
import { useDeleteWorkspaceDialog } from "../components/deleteWorkspaceDialog";
import { DisabledTooltip } from "../components/disabledTooltip";
import {
  EditGcsBucket,
  useEditGcsBucketState,
} from "../components/editGcsBucket";
import { EditWorkspaceButton } from "../components/editWorkspace";
import { EmptyCard } from "../components/emptyCard";
import { usePageErrorHandler } from "../components/errorhandler";
import { bindFlyover } from "../components/flyover";
import { GitRepoLink } from "../components/gitRepoLink";
import { CheckRole, roleContains } from "../components/iamRole";
import { lastModifiedToString } from "../components/lastModified";
import { InlineLoading, Loading } from "../components/loading";
import { LoadingBackdrop } from "../components/loadingBackdrop";
import { Markdown } from "../components/markdownEditor";
import { NewResourceButton } from "../components/newResourceButton";
import { NotebookCard } from "../components/notebookCard";
import { NoWrapCell } from "../components/noWrapCell";
import { NoWrapTypography } from "../components/noWrapTypography";
import { OpenResourceButton } from "../components/openResource";
import { OverflowTooltip } from "../components/overflowTooltip";
import { PageContent } from "../components/pageContent";
import {
  PageTitle,
  PageTitleDetail,
  PageTitleTab,
  PageTitleTabs,
} from "../components/pageTitle";
import { PaperContents } from "../components/paperContents";
import {
  PaperList,
  PaperListItem,
  PaperListItemContents,
  PaperListItemMore,
  PaperListItemTitle,
} from "../components/paperList";
import { PaperTitle } from "../components/paperTitle";
import {
  ResourceIcon,
  resourceTypeToString,
  stewardshipTypeToString,
} from "../components/resourceIcon";
import {
  ResourceTableControl,
  ResourceTableSortField,
} from "../components/resourceTableControl";
import { SectionHeader } from "../components/sectionHeader";
import { ShareWorkspaceButton } from "../components/shareWorkspace";
import { useTitlePrefix } from "../components/title";
import {
  EnumeratedJob,
  IamRole,
  JobReportStatusEnum,
  OperationType,
  ResourceDescription,
  ResourceType,
  WorkspaceDescription,
} from "../generated/workspacemanager";

export default function WorkspacePage(): ReactElement {
  const { workspaceUserFacingId } = useParams<{
    workspaceUserFacingId: string;
  }>();

  const [fastRefresh, setFastRefresh] = useState(false);

  const [selectedResourceId, setSelectedResourceId] = useState("");

  const errorHandler = usePageErrorHandler();
  const { data: workspace } = useWorkspace(workspaceUserFacingId, {
    ...(fastRefresh ? { refreshInterval: 5000 } : {}),
    onError: errorHandler,
  });

  const { data: jobs } = useJobList(workspace?.id, {
    ...(fastRefresh ? { refreshInterval: 5000 } : {}),
    onError: errorHandler,
  });
  const hasJobs = !!jobs && jobs.length > 0;
  useEffect(() => setFastRefresh(hasJobs), [hasJobs]);

  const { data: resources } = useResourceList(workspace?.id, {
    ...(fastRefresh ? { refreshInterval: 5000 } : {}),
    onError: errorHandler,
  });

  const displayName = workspace?.displayName || workspace?.id;
  useTitlePrefix(displayName || "");

  const context = useMemo(() => {
    if (!workspace || !resources || !jobs) return undefined;
    return {
      workspace: workspace,
      resources: resources,
      jobs: jobs,
      selectedResourceId,
      setSelectedResourceId,
    };
  }, [jobs, resources, workspace, selectedResourceId]);

  if (!context) {
    return <Loading />;
  }
  return (
    <WorkspacePageContext.Provider value={context}>
      <WorkspacePageLoaded />
    </WorkspacePageContext.Provider>
  );
}

function WorkspacePageLoaded() {
  const { workspace, jobs } = useWorkspacePage();

  const tabs: { [key: string]: ReactNode } = {
    Overview: <OverviewTab />,
    Resources: <ResourcesTab />,
    Environments: <EnvironmentsTab />,
  };
  const [tab, setTab] = useState("Overview");

  const creating = !!jobs?.find(
    (j) =>
      j.operationType === OperationType.Create &&
      j.jobReport?.status === JobReportStatusEnum.Running &&
      !j.resourceType
  );

  return (
    <div>
      <PageTitle
        title={workspace?.displayName || workspace?.id}
        backTo="/workspaces"
        backText="Workspaces"
        actions={
          <>
            <EditWorkspaceButton
              workspace={workspace}
              iamRole={workspace.highestRole}
            />
            <ShareWorkspaceButton
              workspace={workspace}
              iamRole={workspace.highestRole}
            />
            <MenuButton />
          </>
        }
        details={
          <>
            <PageTitleDetail
              label="Created"
              value={
                <AbsoluteDateTooltip date={workspace.createdDate}>
                  {lastModifiedToString(workspace.createdDate) || "--"}
                </AbsoluteDateTooltip>
              }
            />
            <PageTitleDetail
              label="Last modified"
              value={
                <AbsoluteDateTooltip date={workspace.lastUpdatedDate}>
                  {lastModifiedToString(workspace.lastUpdatedDate) || "--"}
                </AbsoluteDateTooltip>
              }
            />
            <PageTitleDetail
              label="Access Level"
              value={upperToCamel(workspace.highestRole)}
            />
          </>
        }
      >
        {!creating && (
          <PageTitleTabs value={tab} onChange={(_, value) => setTab(value)}>
            {Object.keys(tabs).map((key) => (
              <PageTitleTab key={key} value={key} label={key} />
            ))}
          </PageTitleTabs>
        )}
      </PageTitle>
      {creating ? (
        <WorkspacePageCreating />
      ) : (
        <PageContent>
          <ReadOnlyAlert />
          {tabs[tab]}
        </PageContent>
      )}
    </div>
  );
}

interface WorkspacePageContextType {
  workspace: WorkspaceDescription;
  resources: ResourceDescription[];
  selectedResourceId: string;
  setSelectedResourceId: (id: string) => void;
  jobs: EnumeratedJob[];
}

const WorkspacePageContext = createContext({} as WorkspacePageContextType);
const useWorkspacePage = () => useContext(WorkspacePageContext);

const useWorkspacePageNotebooks = () => {
  const { resources } = useWorkspacePage();
  return resources.filter(
    (r) => r.metadata.resourceType === ResourceType.AiNotebook
  );
};

const useWorkspacePageGitRepos = () => {
  const { resources } = useWorkspacePage();
  return resources.filter(
    (r) => r.metadata.resourceType === ResourceType.GitRepo
  );
};

const useWorkspacePageResources = () => {
  const { resources } = useWorkspacePage();
  return resources.filter(
    (r) =>
      r.metadata.resourceType !== ResourceType.AiNotebook &&
      r.metadata.resourceType !== ResourceType.GitRepo
  );
};

function WorkspacePageCreating() {
  return (
    <Box
      sx={{
        display: "flex",
        mt: 20,
        gap: 3,
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography component="h2" variant="progressBar">
        Preparing your new workspace...
      </Typography>
      <LinearProgress sx={{ width: "50%" }} />
    </Box>
  );
}

function OverviewTab() {
  return (
    <Grid container spacing={3}>
      <Grid item lg={8} xs={12}>
        <Stack spacing={3}>
          <DescriptionCard />
        </Stack>
      </Grid>
      <Grid item lg={4} xs={12}>
        <Stack spacing={3}>
          <CommandLineCard />
          <DetailsCard />
          <GitReposCard />
        </Stack>
      </Grid>
    </Grid>
  );
}

function ResourcesTab() {
  return (
    <Stack spacing={3}>
      <ResourcesCard />
    </Stack>
  );
}

function EnvironmentsTab() {
  return (
    <Grid container spacing={3}>
      <Grid item lg={8} xs={12}>
        <Stack spacing={3}>
          <NotebooksCard />
        </Stack>
      </Grid>
      <Grid item lg={4} xs={12}>
        <Stack spacing={3}>
          <GitReposCard />
        </Stack>
      </Grid>
    </Grid>
  );
}

function ReadOnlyAlert() {
  const { workspace, resources } = useWorkspacePage();
  const { show: showCloneWorkspace, cloneWorkspace } = useCloneWorkspace({
    workspace: workspace,
    resources: resources,
  });

  return (
    <CheckRole role={workspace.highestRole} is={IamRole.Reader}>
      {cloneWorkspace}
      <Alert
        severity="info"
        sx={{ mb: 3 }}
        action={
          <Button
            variant="contained"
            color="inherit"
            onClick={showCloneWorkspace}
            sx={{ backgroundColor: "white", fontColor: "info.dark" }}
          >
            Duplicate
          </Button>
        }
      >
        You have read-only access to this workspace. Duplicate this workspace to
        make modifications.
      </Alert>
    </CheckRole>
  );
}

function DetailsCard() {
  const { workspace } = useWorkspacePage();
  const projectId = workspace.gcpContext?.projectId;
  return (
    <Card title="Workspace Details">
      <Stack gap={2}>
        <Detail title="ID" value={workspace.userFacingId} />
        <Detail
          title="Google Project"
          value={projectId}
          href={
            projectId &&
            `https://console.cloud.google.com/home/dashboard?project=${projectId}`
          }
          target="_blank"
        />
      </Stack>
    </Card>
  );
}

interface DetailProps {
  title: string;
  value?: ReactNode;
  href?: string;
  target?: string;
}

function Detail({ title, value, href, target }: DetailProps) {
  value = value || "--";
  return (
    <div>
      <Typography variant="overline">{title}</Typography>
      <Typography variant="body2">
        {href ? (
          <Link href={href} target={target}>
            {value}
          </Link>
        ) : (
          <>{value}</>
        )}
      </Typography>
    </div>
  );
}

function GitReposCard() {
  const { workspace } = useWorkspacePage();
  const gitRepos = useWorkspacePageGitRepos();

  const { createGitRepoReference, show } = useCreateGitRepoReference({
    workspace: workspace,
  });
  const addButton = (
    <DisabledTooltip title="You must be an Owner or Writer to add a git repository">
      <Button
        variant="outlined"
        startIcon={<Icon>add</Icon>}
        onClick={show}
        disabled={!roleContains(workspace.highestRole, IamRole.Writer)}
        sx={{ mt: 2 }}
      >
        Add a repository
      </Button>
    </DisabledTooltip>
  );

  return (
    <Card title="Git Repositories" noPadding>
      {gitRepos.length ? (
        <div>
          <PaperList>
            {gitRepos.map((repo) => (
              <PaperListItem key={repo.metadata.resourceId}>
                <PaperListItemTitle
                  title={repo.metadata.name}
                  actions={
                    <ResourceMenuButton workspace={workspace} resource={repo} />
                  }
                />
                <PaperListItemContents>
                  <Typography variant="body2">
                    <GitRepoLink
                      url={repo.resourceAttributes.gitRepo?.gitRepoUrl}
                    />
                  </Typography>
                </PaperListItemContents>
                <PaperListItemMore>
                  <Detail
                    title="Description"
                    value={repo.metadata.description}
                  />
                </PaperListItemMore>
              </PaperListItem>
            ))}
          </PaperList>
          <PaperContents>{addButton}</PaperContents>
        </div>
      ) : (
        <PaperContents>
          <Typography>
            When you add a reference to a git repository, we will clone it to
            any VM you create, so you can better manage your source code.
          </Typography>
          {addButton}
        </PaperContents>
      )}
      {createGitRepoReference}
    </Card>
  );
}

function CommandLineCard() {
  const { workspace } = useWorkspacePage();
  const command = `terra workspace set --id=${workspace.userFacingId}`;
  return (
    <Card
      title="Terra CLI"
      actions={
        <Button
          variant="contained"
          size="small"
          href="https://github.com/DataBiosphere/terra-cli#install-and-run"
          startIcon={<Icon>download</Icon>}
        >
          Download
        </Button>
      }
    >
      <Typography paragraph>
        Fully control the workspace via the CLI.
      </Typography>
      <Typography paragraph>
        Workflow tools (CLI-only): Setup, edit, and launch your scientific
        workflows with Nextflow and Cromwell.
      </Typography>
      <Typography variant="overline">Set workspace</Typography>
      <Paper
        variant="outlined"
        component="code"
        sx={{
          display: "block",
          color: "white",
          backgroundColor: "black",
          p: 1,
        }}
      >
        <Box display="flex" alignItems="flex-start" gap={1}>
          <Box flexGrow={1}>{command}</Box>
          <CopyToClipboardButton
            value={command}
            buttonProps={{ sx: { color: "white" } }}
          />
        </Box>
      </Paper>
    </Card>
  );
}

function DescriptionCard() {
  const { workspace } = useWorkspacePage();
  return (
    <>
      <SectionHeader primary="Description" />
      <Card>
        {workspace.description ? (
          <Markdown value={workspace.description} />
        ) : (
          <EmptyCard
            primary="No description"
            secondary="Add a description to provide more infomation about this workspace."
            action={
              <EditWorkspaceButton
                workspace={workspace}
                iamRole={workspace.highestRole}
              />
            }
          />
        )}
      </Card>
    </>
  );
}

function ResourcesCard() {
  const { workspace, jobs, selectedResourceId } = useWorkspacePage();
  const resources = useWorkspacePageResources();

  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.up("sm"));

  const isCloning = !!jobs?.find(
    (j) =>
      j.jobReport?.status === JobReportStatusEnum.Running &&
      j.operationType === OperationType.Clone &&
      !j.resourceType
  );

  const isDetailsPaneOpen = !!selectedResourceId;

  return (
    <>
      <SectionHeader
        primary="Resources"
        actions={
          <Box sx={{ display: "flex", gap: 2 }}>
            <NewResourceButton workspace={workspace} />
            <AddReferenceButton />
          </Box>
        }
      />
      <Box
        sx={
          sm
            ? {
                display: "flex",
                gap: 2,
              }
            : {}
        }
      >
        <Box sx={{ flexGrow: 1 }}>
          <Card noPadding>
            {resources.length || isCloning ? (
              <ResourcesTable />
            ) : (
              <EmptyCard
                primary="Every analysis begins with your resources"
                secondary="Add some resources to unlock the full power of your workspace"
                sx={{ my: 3 }}
              />
            )}
            {isCloning && <InlineLoading />}
          </Card>
        </Box>
        {isDetailsPaneOpen && <DetailsPane />}
      </Box>
    </>
  );
}

function DetailsPane() {
  const { workspace, resources, selectedResourceId, setSelectedResourceId } =
    useWorkspacePage();
  const selectedResource = resources.find(
    (r) => r.metadata.resourceId === selectedResourceId
  );

  const tabs: { [key: string]: ReactNode } = {
    Details: <DetailsTab />,
  };
  const [tab, setTab] = useState("Details");

  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.up("sm"));

  if (!selectedResource) return null;
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: sm ? "600px" : "100%",
        height: "fit-content",
      }}
    >
      <Paper variant="outlined">
        <DetailsPaneHeader
          title={selectedResource?.metadata?.name || ""}
          onClose={() => setSelectedResourceId("")}
        >
          <DetailsPaneActionBar
            workspace={workspace}
            selectedResource={selectedResource}
          />
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            {Object.keys(tabs).map((key) => (
              <Tab key={key} value={key} label={key} />
            ))}
          </Tabs>
        </DetailsPaneHeader>
        <Box sx={{ padding: 2 }}>{tabs[tab]}</Box>
      </Paper>
    </Box>
  );
}
export interface DetailsPaneHeaderProps {
  title?: string;
  onClose: () => void;
  children?: ReactNode;
}

export function DetailsPaneHeader({
  title,
  onClose,
  children,
}: DetailsPaneHeaderProps): ReactElement {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
        }}
      >
        <Typography variant="h2" sx={{ color: "#212121", fontSize: "16px" }}>
          {title}
        </Typography>
        <IconButton onClick={onClose}>
          <Icon>close</Icon>
        </IconButton>
      </Box>
      <Box>{children}</Box>
    </Box>
  );
}

export interface DetailsPaneActionBarProps {
  workspace: WorkspaceDescription;
  selectedResource: ResourceDescription;
}

export function DetailsPaneActionBar({
  workspace,
  selectedResource,
}: DetailsPaneActionBarProps) {
  const editResource = useEditResourceState(selectedResource);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 1,
        pl: 3,
        gap: 2,
      }}
    >
      {editResource && (
        <Button
          variant="outlined"
          aria-label="editResourceButton"
          {...bindTrigger(editResource)}
        >
          Edit details
        </Button>
      )}
      <ResourceMenuButton workspace={workspace} resource={selectedResource} />
      {/* Flyover Dialog */}
      {editResource && (
        <ResourceEdit
          workspace={workspace}
          resource={selectedResource}
          state={editResource}
        />
      )}
    </Box>
  );
}

function DetailsTab() {
  const { workspace, resources, selectedResourceId } = useWorkspacePage();
  const selectedResource = resources.find(
    (r) => r.metadata.resourceId === selectedResourceId
  );

  const getResourceId = (resource: ResourceDescription) => {
    switch (resource.metadata?.resourceType) {
      case ResourceType.BigQueryDataset:
        return resource.resourceAttributes.gcpBqDataset?.datasetId;
      case ResourceType.BigQueryDataTable:
        return resource.resourceAttributes.gcpBqDataTable?.datasetId;
      case ResourceType.GcsBucket:
        return resource.resourceAttributes.gcpGcsBucket?.bucketName;
      case ResourceType.GcsObject:
        return resource.resourceAttributes.gcpGcsObject?.bucketName;
    }
  };

  if (!selectedResource) return <></>;

  const { resourceId, resourceType, stewardshipType, description } =
    selectedResource.metadata;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Typography>Type</Typography>
        </Grid>
        <Grid item xs={9}>
          <Typography align="left">
            {resourceTypeToString(resourceType) +
              ", " +
              stewardshipTypeToString(stewardshipType)}
          </Typography>
        </Grid>
        <Grid item xs={3}>
          UUID
        </Grid>
        <Grid item xs={9}>
          <Typography align="left">{resourceId}</Typography>
        </Grid>
        <Grid item xs={3}>
          Source
        </Grid>
        <Grid item xs={9}>
          <Box display="flex" alignItems="center" mt={-0.5}>
            <Typography>{getResourceId(selectedResource)}</Typography>
            <OpenResourceButton
              workspace={workspace}
              resource={selectedResource}
            />
          </Box>
        </Grid>
        {description && (
          <>
            <Grid item xs={3}>
              Description
            </Grid>
            <Grid item xs={9}>
              <Typography align="left">{description}</Typography>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

function ResourcesTable() {
  const { selectedResourceId, setSelectedResourceId } = useWorkspacePage();
  const resources = useWorkspacePageResources();

  return (
    <TableContainer>
      <ResourceTableControl resources={resources}>
        {({ sortedResources }) => (
          <Table
            size="small"
            width="100%"
            sx={{ tableLayout: "fixed" }}
            data-testid="resources-table"
          >
            <TableHead sx={{ bgcolor: "table.head" }}>
              <TableRow>
                <TableCell width="5%">
                  <ResourceTableSortField field="resourceType" />
                </TableCell>
                <TableCell width="35%">
                  <ResourceTableSortField label="Name" field="name" />
                </TableCell>
                <TableCell width="60%">
                  <ResourceTableSortField
                    label="Description"
                    field="description"
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedResources.map((resource) => {
                const metadata = resource.metadata || {};
                return (
                  <TableRow
                    key={metadata.resourceId}
                    hover
                    selected={selectedResourceId === metadata.resourceId}
                    sx={{
                      "&:hover": {
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => setSelectedResourceId(metadata.resourceId)}
                  >
                    <TableCell>
                      <ResourceIcon
                        resourceType={metadata.resourceType}
                        iconProps={{ sx: { verticalAlign: "middle" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <OverflowTooltip title={metadata.name} />
                      <NoWrapTypography
                        sx={{ fontSize: 12, color: "table.secondary" }}
                      >
                        {resourceTypeToString(metadata.resourceType)}
                        ,&nbsp;
                        {stewardshipTypeToString(metadata.stewardshipType)}
                      </NoWrapTypography>
                    </TableCell>
                    <NoWrapCell>{metadata.description}</NoWrapCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ResourceTableControl>
    </TableContainer>
  );
}

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children?: ReactNode;
  noPadding?: boolean;
}

function Card({ title, actions, children, noPadding }: CardProps) {
  return (
    <Paper variant="outlined">
      {title || actions ? (
        <PaperTitle primary={title} actions={actions} />
      ) : (
        <Box sx={{ mt: noPadding ? undefined : 3 }} />
      )}
      {noPadding ? children : <PaperContents>{children}</PaperContents>}
    </Paper>
  );
}

function AddReferenceButton() {
  const { workspace, resources } = useWorkspacePage();
  const { createBucketReference, show: showBucket } = useCreateBucketReference({
    workspace: workspace,
  });
  const { createObjectReference, show: showObject } = useCreateObjectReference({
    workspace: workspace,
  });
  const { createBigQueryDatasetReference, show: showBigQueryDataset } =
    useCreateBigQueryDatasetReference({ workspace: workspace });
  const { createBigQueryDataTableReference, show: showBigQueryDataTable } =
    useCreateBigQueryDataTableReference({ workspace: workspace });
  const { addFromDataCollection, show: showAddFromDataCollection } =
    useAddFromDataCollection({ workspace: workspace, resources: resources });

  const menuState = usePopupState({
    variant: "popover",
    popupId: "add-reference-menu",
  });

  return (
    <div>
      <Button
        variant="contained"
        startIcon={<Icon>add</Icon>}
        {...bindTrigger(menuState)}
      >
        Add
      </Button>
      <Menu onClick={menuState.close} {...bindMenu(menuState)}>
        <MenuItem onClick={showAddFromDataCollection}>
          Data from the catalog
        </MenuItem>
        <Divider />
        <MenuItem onClick={showBucket}>Cloud Storage bucket reference</MenuItem>
        <MenuItem onClick={showObject}>Cloud Storage object reference</MenuItem>
        <MenuItem onClick={showBigQueryDataset}>
          BigQuery dataset reference
        </MenuItem>
        <MenuItem onClick={showBigQueryDataTable}>
          BigQuery data table reference
        </MenuItem>
      </Menu>
      {createBucketReference}
      {createObjectReference}
      {createBigQueryDatasetReference}
      {createBigQueryDataTableReference}
      {addFromDataCollection}
    </div>
  );
}

function NotebooksCard() {
  const { workspace, jobs } = useWorkspacePage();
  const notebooks = useWorkspacePageNotebooks();

  const { createNotebookInstance, show } = useCreateNotebookInstance({
    workspace: workspace,
  });
  const newNotebookButton = (
    <div>
      <Button variant="contained" startIcon={<Icon>add</Icon>} onClick={show}>
        Add another machine
      </Button>
      {createNotebookInstance}
    </div>
  );
  return notebooks.length ? (
    <>
      <SectionHeader
        primary="Your notebook instances"
        color="primary.main"
        actions={notebooks.length > 0 && newNotebookButton}
      />
      {notebooks.map((notebook) => (
        <NotebookCard
          key={notebook.metadata.resourceId}
          workspace={workspace}
          notebook={notebook}
          job={resourceJob(notebook, jobs)}
          aria-label="notebook-card"
          data-testid="notebook-card"
        />
      ))}
    </>
  ) : (
    <EmptyCard
      primary="No analyses yet"
      secondary="Add a new notebook to get started with your analysis."
      action={newNotebookButton}
    />
  );
}

function MenuButton() {
  const { workspace, resources } = useWorkspacePage();
  const { show: showCloneWorkspace, cloneWorkspace } = useCloneWorkspace({
    workspace: workspace,
    resources: resources,
  });
  const { run: deleteWorkspace, isPending: deletePending } =
    useDeleteWorkspace(workspace);

  const { deleteWorkspaceDialog, show: showDeleteDialog } =
    useDeleteWorkspaceDialog({
      workspace,
      run: deleteWorkspace,
    });

  const menuState = usePopupState({
    variant: "popover",
    popupId: "workspace-long-menu",
  });

  return (
    <div>
      <IconButton {...bindTrigger(menuState)}>
        <Icon>more_vert</Icon>
      </IconButton>
      <Menu onClick={menuState.close} {...bindMenu(menuState)}>
        <MenuList sx={{ p: 0 }}>
          <MenuItem onClick={showCloneWorkspace}>Duplicate</MenuItem>
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
      <LoadingBackdrop open={deletePending} />
    </div>
  );
}

interface ResourceMenuButtonProps {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
  job?: EnumeratedJob;
}

function ResourceMenuButton({ resource, job }: ResourceMenuButtonProps) {
  const { setSelectedResourceId } = useWorkspacePage();
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
            setSelectedResourceId("");
            deleteResource.run();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}

interface ResourceEditProps {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
  state: PopupState;
}

function ResourceEdit({ workspace, resource, state }: ResourceEditProps) {
  switch (resource.metadata.resourceType) {
    case ResourceType.GcsBucket:
      return (
        <EditGcsBucket
          workspace={workspace}
          resource={resource}
          {...bindFlyover(state)}
        />
      );
    default:
      return null;
  }
}

function useEditResourceState(resource: ResourceDescription) {
  const editGcsBucketState = useEditGcsBucketState(resource);

  switch (resource.metadata.resourceType) {
    case ResourceType.GcsBucket:
      return editGcsBucketState;
    default:
      return null;
  }
}

function upperToCamel(upper: string) {
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

function resourceJob(resource: ResourceDescription, jobs: EnumeratedJob[]) {
  return jobs?.find(
    (j) =>
      j.jobReport?.status === JobReportStatusEnum.Running &&
      j.resourceType &&
      j.metadata?.resourceId === resource.metadata?.resourceId
  );
}
