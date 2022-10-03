import {
  Alert,
  Box,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { useFolderList } from "../components/api/folder";
import { useJobList } from "../components/api/jobList";
import {
  ResourceLineageType,
  useResourceGetLineage,
  useResourceList,
} from "../components/api/resourceList";
import {
  isDataCollection,
  useDataCollectionList,
  useWorkspace,
} from "../components/api/workspace";
import { useCloneWorkspace } from "../components/cloneWorkspace";
import { CopyToClipboardButton } from "../components/copyToClipboardButton";
import { useCreateBigQueryDatasetReference } from "../components/createBigQueryDatasetReference";
import { useCreateBigQueryDataTableReference } from "../components/createBigQueryDataTableReference";
import { useCreateBucketReference } from "../components/createBucketReference";
import { useCreateGitRepoReference } from "../components/createGitRepoReference";
import { useCreateNotebookInstance } from "../components/createNotebookInstance";
import { useCreateObjectReference } from "../components/createObjectReference";
import {
  DeleteWorkspaceMenuItem,
  useDeleteWorkspace,
} from "../components/deleteWorkspace";
import { useDeleteWorkspaceDialog } from "../components/deleteWorkspaceDialog";
import { DetailsPane } from "../components/detailsPane";
import { DisabledTooltip } from "../components/disabledTooltip";
import {
  EditDatatable,
  useEditDatatableState,
} from "../components/editBigQueryDatatable";
import {
  EditDataset,
  useEditDatasetState,
} from "../components/editBiqQueryDataset";
import {
  EditGcsBucket,
  useEditGcsBucketState,
} from "../components/editGcsBucket";
import {
  EditGcsObject,
  useEditGcsObjectState,
} from "../components/editGcsObject";
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
import { MultilineTypography } from "../components/multilineTypography";
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
import { useRecentWorkspacesRecord } from "../components/recentWorkspaces";
import {
  ResourceIcon,
  resourceTypeToString,
  stewardshipTypeToString,
} from "../components/resourceIcon";
import { ResourceMenuButton } from "../components/resourceMenuButton";
import {
  foldersToNodes,
  ResourceNode,
  ResourceNodeRow,
  resourcesToNodes,
} from "../components/resourceNodeRow";
import { ResourceTableSortField } from "../components/resourceTableControl";
import { SectionHeader } from "../components/sectionHeader";
import { ShareWorkspaceButton } from "../components/shareWorkspace";
import { useTitlePrefix } from "../components/title";
import { useUserIdentity } from "../components/useUserIdentity";
import {
  useWorkspaceDataColectionsTablePopupState,
  WorkspaceDataCollectionsTable,
} from "../components/workspaceDataCollectionsTable";
import {
  EnumeratedJob,
  Folder,
  IamRole,
  JobReportStatusEnum,
  OperationType,
  ResourceDescription,
  ResourceType,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { pluralize } from "../lib/pluralize";

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

  useRecentWorkspacesRecord(workspace?.id);

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

  const { data: folders } = useFolderList(workspace?.id, {
    ...(fastRefresh ? { refreshInterval: 5000 } : {}),
    onError: errorHandler,
  });

  const displayName = workspace?.displayName || workspace?.id;
  useTitlePrefix(displayName || "");

  const context = useMemo(() => {
    if (!workspace || !resources || !folders || !jobs) return undefined;
    return {
      workspace: workspace,
      resources: resources,
      folders: folders,
      jobs: jobs,
      selectedResourceId,
      setSelectedResourceId,
    };
  }, [jobs, resources, folders, workspace, selectedResourceId]);

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
  folders: Folder[];
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
  const { workspace, setSelectedResourceId } = useWorkspacePage();
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
                    <ResourceMenuButton
                      resource={repo}
                      onDelete={() => setSelectedResourceId("")}
                    />
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

interface ResourcesCardSubheaderProps {
  dataCollections: WorkspaceDescription[];
  resources: ResourceDescription[];
}

function ResourcesCardSubheader({
  dataCollections,
  resources,
}: ResourcesCardSubheaderProps) {
  // TODO: This will only find one dc per resource
  // Adjust if multiple dcs per resource is possible
  const [dcResources, dcsInWorkspace] = useMemo(() => {
    const dcMap = dataCollections.reduce((curr, dc) => {
      curr.set(dc.id, dc);
      return curr;
    }, new Map<string, WorkspaceDescription>());

    return resources.reduce(
      (curr, r) => {
        const lineage = r.metadata.resourceLineage?.find((l) =>
          dcMap.get(l.sourceWorkspaceId)
        );
        const dc = dcMap.get(lineage?.sourceWorkspaceId || "");
        if (dc) {
          curr[0].add(r);
          curr[1].add(dc);
        }
        return curr;
      },
      [new Set<ResourceDescription>(), new Set<WorkspaceDescription>()]
    );
  }, [resources, dataCollections]);

  const totalCount = resources.length;
  const dcCount = dcsInWorkspace.size;
  let subheaderContent = pluralize("resource", totalCount, true);
  let subheaderLinkContent = null;
  if (dcCount) {
    subheaderContent =
      `${subheaderContent} • ` +
      `${pluralize("resource", dcResources.size, true)} from `;
    subheaderLinkContent =
      `${dcCount ? dcCount + " " : ""}` +
      `${pluralize("data collection", dcCount, false)}`;
  }

  const tablePopupState = useWorkspaceDataColectionsTablePopupState();
  return (
    <>
      {subheaderContent}
      {subheaderLinkContent && (
        <Link component="button" variant="body1" onClick={tablePopupState.open}>
          {subheaderLinkContent}
        </Link>
      )}
      <WorkspaceDataCollectionsTable
        dataCollections={[...dcsInWorkspace]}
        {...bindFlyover(tablePopupState)}
      />
    </>
  );
}

function ResourcesCard() {
  const { workspace, folders, jobs, selectedResourceId } = useWorkspacePage();
  const resources = useWorkspacePageResources();

  const errorHandler = usePageErrorHandler();
  const { data: dataCollections } = useDataCollectionList({
    onError: errorHandler,
  });

  const selectedResourceNode = useMemo(
    () =>
      [...resourcesToNodes(resources), ...foldersToNodes(folders)].find(
        (node) => node.id === selectedResourceId
      ),
    [resources, folders, selectedResourceId]
  );

  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.up("sm"));

  const isCloning = !!jobs?.find(
    (j) =>
      j.jobReport?.status === JobReportStatusEnum.Running &&
      j.operationType === OperationType.Clone &&
      !j.resourceType
  );

  if (!dataCollections) return <Loading />;

  return (
    <>
      <SectionHeader
        primary="Resources"
        secondary={
          <ResourcesCardSubheader
            dataCollections={dataCollections}
            resources={resources}
          />
        }
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
        {selectedResourceNode &&
          (selectedResourceNode.type === "resource" ? (
            <ResourceDetailsPane resource={selectedResourceNode.resource} />
          ) : (
            <FolderDetailsPane folder={selectedResourceNode.folder} />
          ))}
      </Box>
    </>
  );
}

interface ResourceDetailsPaneProps {
  resource: ResourceDescription;
}

function ResourceDetailsPane({ resource }: ResourceDetailsPaneProps) {
  const { workspace, setSelectedResourceId } = useWorkspacePage();
  const tabs: { [key: string]: ReactNode } = {
    Details: <ResourceDetailsTab resource={resource} />,
    Lineage: <LineageTab selectedResource={resource} />,
  };
  const [selectedTab, setSelectedTab] = useState("Details");

  return (
    <DetailsPane
      title={resource.metadata?.name}
      tabs={tabs}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      onClose={() => setSelectedResourceId("")}
      actions={
        <>
          <EditResourceButton workspace={workspace} resource={resource} />
          <ResourceMenuButton
            resource={resource}
            onDelete={() => setSelectedResourceId("")}
          />
        </>
      }
    />
  );
}

interface FolderDetailsPaneProps {
  folder: Folder;
}

function FolderDetailsPane({ folder }: FolderDetailsPaneProps) {
  const { setSelectedResourceId } = useWorkspacePage();
  const tabs: { [key: string]: ReactNode } = {
    Details: <FolderDetailsTab folder={folder} />,
  };
  const [selectedTab, setSelectedTab] = useState("Details");

  return (
    <DetailsPane
      title={folder.displayName}
      tabs={tabs}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      onClose={() => setSelectedResourceId("")}
    />
  );
}

export interface EditResourceButtonProps {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
}

export function EditResourceButton({
  workspace,
  resource,
}: EditResourceButtonProps) {
  const editResource = useEditResourceState(resource);
  return (
    <>
      {editResource && (
        <Button
          variant="outlined"
          aria-label="editResourceButton"
          {...bindTrigger(editResource)}
        >
          Edit details
        </Button>
      )}
      {/* Flyover Dialog */}
      {editResource && (
        <ResourceEdit
          workspace={workspace}
          resource={resource}
          state={editResource}
        />
      )}
    </>
  );
}

interface ResourceDetailsTabProps {
  resource: ResourceDescription;
}

function ResourceDetailsTab({ resource }: ResourceDetailsTabProps) {
  const { workspace } = useWorkspacePage();
  const { resourceId, resourceType, stewardshipType, description } =
    resource.metadata;

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
            <Typography>{getCloudResourceId(resource)}</Typography>
            <OpenResourceButton workspace={workspace} resource={resource} />
          </Box>
        </Grid>
        <Grid item xs={3}>
          Description
        </Grid>
        <Grid item xs={9}>
          <Typography align="left">{description || "--"}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface FolderDetailsTabProps {
  folder: Folder;
}

function FolderDetailsTab({ folder }: FolderDetailsTabProps) {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Typography>Type</Typography>
        </Grid>
        <Grid item xs={9}>
          <Typography align="left">Folder</Typography>
        </Grid>
        <Grid item xs={3}>
          Description
        </Grid>
        <Grid item xs={9}>
          <Typography align="left">{folder.description || "--"}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface LineageTabProps {
  selectedResource?: ResourceDescription;
}

function LineageTab({ selectedResource }: LineageTabProps) {
  const { workspace } = useWorkspacePage();
  const { data: resourceLineage } = useResourceGetLineage(
    workspace.id,
    selectedResource?.metadata.resourceId || "",
    selectedResource?.metadata.resourceLineage || []
  );

  if (!selectedResource || !resourceLineage) return <></>;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 2 }}>
      {[...resourceLineage, workspace, selectedResource].map(
        (lineageItem, idx) => (
          <>
            {idx !== 0 && (
              <Box // lineage chip separator
                key={idx * 2}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  width: "2px",
                  height: "36px",
                  ml: "18px",
                }}
              />
            )}
            <LineageChip key={idx * 2 + 1} lineageItem={lineageItem} />
          </>
        )
      )}
    </Box>
  );
}

interface LineageChipProps {
  lineageItem: ResourceLineageType;
}

function isWorkspace(item: ResourceLineageType): item is WorkspaceDescription {
  return (
    (item as WorkspaceDescription).id !== undefined &&
    (item as WorkspaceDescription).userFacingId !== undefined &&
    (item as WorkspaceDescription).highestRole !== undefined
  );
}

function isResource(item: ResourceLineageType): item is ResourceDescription {
  return (
    (item as ResourceDescription).metadata !== undefined &&
    (item as ResourceDescription).resourceAttributes !== undefined
  );
}

interface LineageChipMetadata {
  icon: ReactNode;
  isIconHighlighted: boolean;
  name: string;
  lastUpdatedDate?: Date;
  lastUpdatedBy?: string;
  workspaceUrl?: string;
  isDataCollection?: boolean;
  errorMessage?: string;
}

function LineageChip({ lineageItem }: LineageChipProps) {
  const userIdentity = useUserIdentity();
  const theme = useTheme();

  let metadata: LineageChipMetadata;
  if (isResource(lineageItem)) {
    metadata = {
      icon: (
        <ResourceIcon
          resourceType={lineageItem.metadata.resourceType}
          iconProps={{ sx: { color: "white" } }}
        />
      ),
      isIconHighlighted: true,
      name: lineageItem.metadata.name || "",
    };
  } else if (isWorkspace(lineageItem)) {
    metadata = {
      icon: <Icon sx={{ color: "white" }}>bubble_chart</Icon>,
      isIconHighlighted: false,
      name: lineageItem.userFacingId,
      lastUpdatedDate: lineageItem.lastUpdatedDate,
      lastUpdatedBy: userIdentity(lineageItem.lastUpdatedBy),
      workspaceUrl: `/workspaces/${lineageItem.userFacingId}`,
    };
    if (isDataCollection(lineageItem)) {
      // workspace is a data collection
      metadata = Object.assign(metadata, {
        icon: <Icon sx={{ color: "white" }}>collections_bookmark</Icon>,
        isDataCollection: true,
      });
    }
  } else {
    // lineageItem is unknown
    metadata = {
      icon: <Icon sx={{ color: "white" }}>bubble_chart</Icon>,
      isIconHighlighted: false,
      name: "Unknown Workspace",
      errorMessage: "You don't have access to this workspace",
    };
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: metadata.isIconHighlighted
            ? theme.palette.primary.main
            : "rgba(0, 0, 0, 0.3)",
          borderRadius: "50%",
        }}
      >
        {metadata.icon}
      </Box>
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: -0.5,
            height: "20px",
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>{metadata.name}</Typography>
          {metadata.workspaceUrl && (
            <IconButton href={metadata.workspaceUrl} target="_blank">
              <Icon>open_in_new</Icon>
            </IconButton>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            fontSize: "12px",
            color: theme.palette.grey[600],
          }}
        >
          {metadata.errorMessage ? (
            metadata.errorMessage
          ) : (
            <>
              {metadata.isDataCollection && <>Published&nbsp;</>}
              <AbsoluteDateTooltip date={metadata.lastUpdatedDate}>
                {lastModifiedToString(metadata.lastUpdatedDate) || "--"}
              </AbsoluteDateTooltip>
              &nbsp;
              {metadata.lastUpdatedBy && (
                <OverflowTooltip
                  title={`by ${userIdentity(metadata.lastUpdatedBy)}`}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function ResourcesTable() {
  const resources = useWorkspacePageResources();
  const { folders, selectedResourceId, setSelectedResourceId } =
    useWorkspacePage();

  const resourceNodes = useMemo(() => {
    return [...resourcesToNodes(resources), ...foldersToNodes(folders)];
  }, [resources, folders]);

  const resourceNodeChildrenMap = useMemo(() => {
    const map = new Map<string, ResourceNode[]>();
    resourceNodes.forEach((node) => {
      const parentId = node.parentId || "";
      map.set(parentId, [...(map.get(parentId) || []), node]);
    });
    return map;
  }, [resourceNodes]);

  return (
    <TableContainer>
      {/* Sorting disabled */}
      <Table
        size="small"
        width="100%"
        sx={{ tableLayout: "fixed" }}
        data-testid="resources-table"
      >
        <TableHead sx={{ bgcolor: "table.head" }}>
          <TableRow>
            <TableCell width="80%">
              <ResourceTableSortField label="Name & Description" field="name" />
            </TableCell>
            <TableCell width="20%">
              <ResourceTableSortField label="Type" field="resourceType" />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resourceNodeChildrenMap.get("")?.map((resourceNode) => (
            <ResourceNodeRow
              key={resourceNode.id}
              resourceNode={resourceNode}
              resourceNodeChildrenMap={resourceNodeChildrenMap}
            >
              {(resourceNode, isExpanded, setIsExpanded, indent) =>
                resourceNode.type === "resource" ? (
                  <ResourceRow
                    resource={resourceNode.resource}
                    setSelectedResourceId={setSelectedResourceId}
                    indent={indent}
                    selected={resourceNode.id === selectedResourceId}
                  />
                ) : (
                  <FolderRow
                    folder={resourceNode.folder}
                    setSelectedResourceId={setSelectedResourceId}
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    indent={indent}
                    selected={resourceNode.id === selectedResourceId}
                  />
                )
              }
            </ResourceNodeRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface ResourceRowProps {
  resource: ResourceDescription;
  setSelectedResourceId: (resourceId: string) => void;
  indent?: number;
  selected?: boolean;
}

function ResourceRow({
  resource,
  setSelectedResourceId,
  indent = 0,
  selected = false,
}: ResourceRowProps) {
  const { resourceId, resourceType, name, description, stewardshipType } =
    resource.metadata;

  return (
    <TableRow
      key={resourceId}
      hover
      selected={selected}
      sx={{
        "&:hover": {
          cursor: "pointer",
        },
      }}
      onClick={() => setSelectedResourceId(resourceId)}
    >
      <TableCell
        sx={{
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          minHeight: "56px",
          gap: 1,
          pl: 1 + indent * 3,
        }}
      >
        <Box sx={{ width: "38px" }} />
        <ResourceIcon resourceType={resourceType} />
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{name}</Typography>
          <MultilineTypography
            maxLines={2}
            sx={{
              fontSize: 12,
              color: "table.secondary",
            }}
          >
            {description}
          </MultilineTypography>
        </Box>
      </TableCell>
      <NoWrapCell>
        <NoWrapTypography sx={{ fontSize: 12, color: "table.secondary" }}>
          {resourceTypeToString(resourceType)}
          {stewardshipType && (
            <>,&nbsp;{stewardshipTypeToString(stewardshipType)}</>
          )}
        </NoWrapTypography>
      </NoWrapCell>
    </TableRow>
  );
}

interface FolderRowProps {
  folder: Folder;
  isExpanded: boolean;
  setSelectedResourceId: (resourceId: string) => void;
  setIsExpanded: (isExpanded: boolean) => void;
  selected?: boolean;
  indent?: number;
}

function FolderRow({
  folder,
  isExpanded,
  setSelectedResourceId,
  setIsExpanded,
  selected = false,
  indent = 0,
}: FolderRowProps) {
  const { id, displayName, description } = folder;

  return (
    <TableRow
      key={id}
      hover
      selected={selected}
      sx={{
        "&:hover": {
          cursor: "pointer",
        },
      }}
      onClick={() => setSelectedResourceId(id)}
    >
      <TableCell
        sx={{
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          minHeight: "56px",
          gap: 1,
          pl: 1 + indent * 3,
        }}
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <Icon>arrow_drop_down</Icon> : <Icon>arrow_right</Icon>}
        </IconButton>
        <Icon>folder_open</Icon>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
            {displayName}
          </Typography>
          <MultilineTypography
            maxLines={2}
            sx={{
              fontSize: 12,
              color: "table.secondary",
            }}
          >
            {description}
          </MultilineTypography>
        </Box>
      </TableCell>
      <NoWrapCell>
        <NoWrapTypography sx={{ fontSize: 12, color: "table.secondary" }}>
          Folder
        </NoWrapTypography>
      </NoWrapCell>
    </TableRow>
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
    case ResourceType.GcsObject:
      return (
        <EditGcsObject
          workspace={workspace}
          resource={resource}
          {...bindFlyover(state)}
        />
      );
    case ResourceType.BigQueryDataset:
      return (
        <EditDataset
          workspace={workspace}
          resource={resource}
          {...bindFlyover(state)}
        />
      );
    case ResourceType.BigQueryDataTable:
      return (
        <EditDatatable
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
  const editGcsObjectState = useEditGcsObjectState(resource);
  const editDatasetState = useEditDatasetState(resource);
  const editDatatableState = useEditDatatableState(resource);

  switch (resource.metadata.resourceType) {
    case ResourceType.GcsBucket:
      return editGcsBucketState;
    case ResourceType.GcsObject:
      return editGcsObjectState;
    case ResourceType.BigQueryDataset:
      return editDatasetState;
    case ResourceType.BigQueryDataTable:
      return editDatatableState;
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

const getCloudResourceId = (resource: ResourceDescription) => {
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
