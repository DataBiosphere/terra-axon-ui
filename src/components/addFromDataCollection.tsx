import {
  Box,
  Button,
  Checkbox,
  Icon,
  Paper,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  TypographyProps,
} from "@mui/material";
import { ValidationErrors } from "final-form";
import { TextField } from "mui-rff";
import { useSnackbar } from "notistack";
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Form, useForm } from "react-final-form";
import * as Yup from "yup";
import {
  CloningInstructionsEnum,
  IamRole,
  ResourceDescription,
  ResourceMetadata,
  ResourceType,
  StewardshipType,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import {
  AbsoluteDateTooltip,
  dateToAbsoluteDateString,
} from "./absoluteDateTooltip";
import { useFolderListReload } from "./api/folder";
import {
  ResourcePropertyNames,
  useResourceList,
  useResourceListReload,
} from "./api/resourceList";
import { useDataCollectionList } from "./api/workspace";
import { useApi } from "./apiProvider";
import { DisablableTableRow } from "./disablableTableRow";
import { ErrorList, errorMessage, usePageErrorHandler } from "./errorhandler";
import { toFinalFormError } from "./fieldValidation";
import { FixedStepConnector } from "./fixedStepConnector";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { folderNameField, FolderNameTextField } from "./folderNameField";
import {
  defaultFolderPath,
  FolderPathField,
  folderPathField,
  isRootFolder,
} from "./folderPathField";
import { roleContains } from "./iamRole";
import { lastModifiedToString } from "./lastModified";
import { Loading } from "./loading";
import { NoWrapCell } from "./noWrapCell";
import { NoWrapTypography } from "./noWrapTypography";
import { OverflowTooltip } from "./overflowTooltip";
import { RadioButton } from "./radioButton";
import { ResourceIcon } from "./resourceIcon";
import {
  ResourceTableControl,
  ResourceTableSortField,
} from "./resourceTableControl";
import { SectionHeader } from "./sectionHeader";
import { ShadedPaper } from "./shadedPaper";
import {
  workspaceAccessLevelComparator,
  workspaceNameDescriptionComparator,
  WorkspaceTableSortField,
} from "./workspaceTableControl";

const schema = Yup.object({
  newOrExistingFolder: Yup.string(),
  folderName: folderNameField(),
  folderPath: folderPathField(),
  description: Yup.string(),
});
type Fields = Yup.InferType<typeof schema>;

export interface AddFromDataCollectionState {
  addFromDataCollection: ReactElement;
  show: () => void;
}

export interface AddFromDataCollectionProps {
  workspace: WorkspaceDescription;
  resources: ResourceDescription[];
}

export function useAddFromDataCollection({
  workspace,
  resources: existingResources,
}: AddFromDataCollectionProps): AddFromDataCollectionState {
  const [dataCollection, setDataCollection] = useState<WorkspaceDescription>();

  const [resources, setResources] = useState<ResourceDescription[]>();
  useEffect(() => setResources([]), [dataCollection]);

  const steps: {
    [label: string]: [
      (props: StepProps) => JSX.Element,
      (fields: Fields) => ValidationErrors
    ];
  } = {
    "Select collection": [
      CollectionStep,
      () => {
        if (!dataCollection)
          return { dataCollection: "Select a data collection" };
        if (!roleContains(workspace.highestRole, IamRole.Reader))
          return { dataCollection: "Request access" };
      },
    ],
    "Select resources": [
      ResourcesStep,
      () => {
        if (!resources?.length)
          return { dataCollection: "Select at least one resource" };
      },
    ],
    "Review selection": [
      ReviewStep,
      ({ newOrExistingFolder, folderName }: Fields) => {
        if (!newOrExistingFolder)
          return { newOrExistingFolder: "Select target" };
        if (newOrExistingFolder === "new" && !folderName)
          return { folderName: "Specify a folder name" };
      },
    ],
  };
  const [step, setStep] = useState(0);
  const isFirstStep = step === 0;
  const isLastStep = step === Object.keys(steps).length - 1;
  const [StepContents, onValidate] = Object.values(steps)[step];

  const stepProps: StepProps = {
    workspace: workspace,
    existingResources: existingResources,
    dataCollection: dataCollection,
    setDataCollection: setDataCollection,
    resources: resources,
    setResources: setResources,
  };

  const createDataCollection = useCreateReferencesAction(workspace);

  const { flyover, setOpen } = useFlyover({
    size: "large",
    title: "Add from data catalog",
    children: (
      <Form
        initialValues={{ folderPath: defaultFolderPath() }}
        onSubmit={
          isLastStep
            ? (values: Fields) =>
                createDataCollection(resources || [], values).then(
                  () => setOpen(false),
                  toFinalFormError
                )
            : () => setStep(step + 1)
        }
        validate={onValidate}
        render={({ handleSubmit, hasValidationErrors, submitError }) => (
          <form noValidate onSubmit={handleSubmit}>
            <FlyoverContent>
              <Box sx={{ width: "100%", my: 3 }}>
                <Stepper activeStep={step} connector={<FixedStepConnector />}>
                  {Object.keys(steps).map((label, index) => (
                    <Step key={index}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
              <ErrorList errors={submitError} />
              <StepContents {...stepProps} />
            </FlyoverContent>
            <FlyoverActions>
              {!isFirstStep && (
                <>
                  <Button onClick={() => setStep(step - 1)}>Back</Button>
                  <Box flexGrow={1} />
                </>
              )}
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={hasValidationErrors}
              >
                {isLastStep ? "Add to your workspace" : "Next"}
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    ),
  });

  const show = useCallback(() => {
    setStep(0);
    setDataCollection(undefined);
    setResources(undefined);
    setOpen(true);
  }, [setOpen]);
  return { addFromDataCollection: flyover, show: show };
}

interface StepProps {
  workspace: WorkspaceDescription;
  existingResources: ResourceDescription[];
  dataCollection?: WorkspaceDescription;
  setDataCollection: Dispatch<SetStateAction<WorkspaceDescription | undefined>>;
  resources?: ResourceDescription[];
  setResources: Dispatch<SetStateAction<ResourceDescription[] | undefined>>;
}

function CollectionStep({ dataCollection, setDataCollection }: StepProps) {
  const errorHandler = usePageErrorHandler();
  const { data: dataCollections } = useDataCollectionList({
    onError: errorHandler,
  });
  if (!dataCollections) {
    return <Loading />;
  }
  return (
    <div>
      <StepDescription>
        Explore our data catalog and choose from available collections.
        You&apos;ll be able to select the resources relevant to you, or
        reference the entire collection.
      </StepDescription>
      <SectionHeader primary="Data collections" />
      <DataCollectionsTable
        dataCollections={dataCollections}
        dataCollectionId={dataCollection?.id || ""}
        onSelect={(id: string) =>
          setDataCollection(dataCollections.find((c) => c.id === id))
        }
      />
    </div>
  );
}

interface DataCollectionsTableProps {
  dataCollections: WorkspaceDescription[];
  dataCollectionId: string;
  onSelect: (dataCollectionId: string) => void;
}

function DataCollectionsTable(props: DataCollectionsTableProps) {
  const { dataCollections, dataCollectionId, onSelect } = props;

  return (
    <TableContainer component={Paper} variant="outlined" square sx={{ my: 3 }}>
      <Table width="100%" sx={{ tableLayout: "fixed" }}>
        <TableHead sx={{ bgcolor: "table.head" }}>
          <TableRow>
            <TableCell width="55%">
              <WorkspaceTableSortField
                label="Name"
                comparator={workspaceNameDescriptionComparator}
              />
            </TableCell>
            <TableCell width="22.5%">
              <WorkspaceTableSortField
                label="Published"
                comparator={(a, b) =>
                  (a.createdDate?.getTime() || 0) -
                  (b.createdDate?.getTime() || 0)
                }
              />
            </TableCell>
            <TableCell width="22.5%">
              <WorkspaceTableSortField
                label="Access"
                comparator={workspaceAccessLevelComparator}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dataCollections.map((dataCollection) => (
            <TableRow
              hover
              key={dataCollection.id}
              onClick={() => {
                if (dataCollection.id === dataCollectionId) {
                  onSelect("");
                } else if (
                  roleContains(dataCollection.highestRole, IamRole.Reader)
                ) {
                  onSelect(dataCollection.id);
                }
              }}
              sx={{
                cursor: "pointer",
                backgroundColor:
                  dataCollection.id === dataCollectionId
                    ? "table.selected"
                    : "default",
              }}
            >
              <NoWrapCell>
                <Box>
                  <OverflowTooltip title={dataCollection.displayName || ""}>
                    <Typography sx={{ color: "table.primary" }}>
                      {dataCollection.displayName}
                    </Typography>
                  </OverflowTooltip>
                </Box>
                <NoWrapTypography
                  sx={{ fontSize: 12, color: "table.secondary" }}
                >
                  {dataCollection.description || "--"}
                </NoWrapTypography>
              </NoWrapCell>
              <NoWrapCell sx={{ color: "table.secondary" }}>
                <AbsoluteDateTooltip date={dataCollection.createdDate}>
                  {lastModifiedToString(dataCollection.createdDate) || "--"}
                </AbsoluteDateTooltip>
              </NoWrapCell>
              <TableCell sx={{ color: "table.secondary" }}>
                <RoleAccess iamRole={dataCollection.highestRole} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ResourcesStep({
  dataCollection,
  existingResources,
  resources,
  setResources,
}: StepProps) {
  const resourcesMap = useMemo(
    () =>
      (resources || []).reduce((m, res) => {
        m.set(res.metadata.resourceId, res);
        return m;
      }, new Map<string, ResourceDescription>()),
    [resources]
  );

  const errorHandler = usePageErrorHandler();
  const { data: allResources } = useResourceList(dataCollection?.id, {
    onError: errorHandler,
  });

  const alreadyAdded = useMemo(
    () =>
      existingResources.reduce((set, r) => {
        const sourceResourceId = r.metadata.resourceLineage?.find(
          (l) => l.sourceWorkspaceId === dataCollection?.id
        )?.sourceResourceId;
        if (
          sourceResourceId &&
          allResources?.find((r) => r.metadata.resourceId === sourceResourceId)
        ) {
          set.add(sourceResourceId);
        }
        return set;
      }, new Set<string>()),
    [allResources, dataCollection?.id, existingResources]
  );
  const availableResources = useMemo(
    () => allResources?.filter((r) => !alreadyAdded.has(r.metadata.resourceId)),
    [allResources, alreadyAdded]
  );

  return (
    <div>
      <StepDescription>
        Select some resources you&apos;d like to reference, or bring the entire
        collection into your workspace. You can always add more references to
        your workspace later.
      </StepDescription>
      <ShadedPaper sx={{ pt: 2, pb: 1 }}>
        <Typography
          sx={{
            color: "grey.800",
            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: "bold",
            mb: 2,
          }}
        >
          {dataCollection?.displayName}
        </Typography>
        <Box sx={{ display: "flex", gap: 10, my: 2 }}>
          {Object.entries({
            "Last Updated": dateToAbsoluteDateString(
              dataCollection?.lastUpdatedDate
            ),
            "Data Policies": dataCollection?.policies?.length || 0,
            Access: (
              <RoleAccess
                verbose
                iamRole={dataCollection?.highestRole || IamRole.Discoverer}
              />
            ),
          }).map(([label, value]) => (
            <div key={label}>
              <Typography
                variant="overline"
                sx={{ color: "grey.600", fontWeight: 600 }}
              >
                {label}
              </Typography>
              <Typography variant="body2" sx={{ color: "grey.800" }}>
                {value}
              </Typography>
            </div>
          ))}
        </Box>
        <Typography sx={{ mt: 2 }}>{dataCollection?.description}</Typography>
      </ShadedPaper>
      <SectionHeader primary="Resources" />
      {allResources ? (
        <TableContainer
          component={Paper}
          variant="outlined"
          square
          sx={{ my: 3 }}
        >
          <ResourceTableControl resources={allResources}>
            {({ sortedResources }) => (
              <Table
                size="small"
                width="100%"
                sx={{ tableLayout: "fixed", width: "fit-content" }}
              >
                <TableHead sx={{ bgcolor: "table.head" }}>
                  <TableRow>
                    <TableCell width="10%">
                      <Checkbox
                        checked={
                          resources?.length === availableResources?.length
                        }
                        onChange={(e) =>
                          setResources(
                            e.target.checked ? availableResources : []
                          )
                        }
                      />
                    </TableCell>
                    <TableCell width="5%">
                      <ResourceTableSortField field="resourceType" />
                    </TableCell>
                    <TableCell width="85%">
                      <ResourceTableSortField
                        label="Name & description"
                        field="name"
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedResources.map((resource) => {
                    const metadata = resource.metadata || {};

                    const added = alreadyAdded.has(metadata.resourceId);
                    const selected =
                      added || resourcesMap.has(metadata.resourceId);
                    return (
                      <DisablableTableRow
                        key={metadata.resourceId}
                        disabled={added}
                        sx={{
                          backgroundColor: selected
                            ? "table.selected"
                            : "default",
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            name={metadata.resourceId}
                            disabled={added}
                            checked={selected}
                            onChange={(e) => {
                              if (added) return;
                              const filtered = (resources || []).filter(
                                (r) =>
                                  r.metadata.resourceId !=
                                  resource.metadata.resourceId
                              );
                              setResources(
                                e.target.checked
                                  ? [...filtered, resource]
                                  : filtered
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <ResourceIcon
                            resourceType={metadata.resourceType}
                            iconProps={{ sx: { verticalAlign: "middle" } }}
                          />
                        </TableCell>
                        <NoWrapCell>
                          <OverflowTooltip title={metadata.name} />
                          <NoWrapTypography sx={{ fontSize: 12 }}>
                            <OverflowTooltip
                              title={metadata.description || "--"}
                            />
                          </NoWrapTypography>
                        </NoWrapCell>
                      </DisablableTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ResourceTableControl>
        </TableContainer>
      ) : (
        <Loading />
      )}
    </div>
  );
}

function ReviewStep({ dataCollection, workspace, resources }: StepProps) {
  const form = useForm();
  const newOrExistingFolder = form.getFieldState("newOrExistingFolder")?.value;

  useEffect(() => {
    if (dataCollection) {
      form.change("folderName", `Data from ${dataCollection.displayName}`);
      form.change("description", dataCollection.description);
    }
  }, [dataCollection, form]);

  return (
    <div>
      <StepDescription>
        Review your selection. Got all the data you need? Let&apos;s add those
        resources to your workspace.
      </StepDescription>
      <Typography
        sx={{ color: "grey.900", fontSize: "20px", lineHeight: "32px" }}
      >
        Resources selected from data collection&nbsp;
        <b>{dataCollection?.displayName}</b>&nbsp;({resources?.length}
        &nbsp;total)
      </Typography>
      <TableContainer
        component={Paper}
        variant="outlined"
        square
        sx={{ my: 3 }}
      >
        <ResourceTableControl resources={resources || []}>
          {({ sortedResources }) => (
            <Table
              size="small"
              width="100%"
              sx={{ tableLayout: "fixed", width: "fit-content" }}
            >
              <TableHead sx={{ bgcolor: "table.head" }}>
                <TableRow>
                  <TableCell width="5%">
                    <ResourceTableSortField field="resourceType" />
                  </TableCell>
                  <TableCell width="95%">
                    <ResourceTableSortField
                      label="Name & description"
                      field="name"
                    />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedResources.map((resource) => {
                  const metadata = resource.metadata || {};
                  return (
                    <TableRow key={metadata.resourceId}>
                      <TableCell>
                        <ResourceIcon
                          resourceType={metadata.resourceType}
                          iconProps={{ sx: { verticalAlign: "middle" } }}
                        />
                      </TableCell>
                      <NoWrapCell>
                        <OverflowTooltip title={metadata.name} />
                        <NoWrapTypography sx={{ fontSize: 12 }}>
                          <OverflowTooltip
                            title={metadata.description || "--"}
                          />
                        </NoWrapTypography>
                      </NoWrapCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ResourceTableControl>
      </TableContainer>
      <StepDescription>
        Where should we send your new resources?
      </StepDescription>
      <RadioGroup row sx={{ my: 2, gap: 2 }}>
        <RadioButton
          name="newOrExistingFolder"
          primary="Create a new folder"
          secondary="Enter name and description"
          value="new"
        />
        <RadioButton
          name="newOrExistingFolder"
          primary="Add to an existing folder"
          secondary="Select root for top level folder"
          value="existing"
        />
      </RadioGroup>
      {newOrExistingFolder === "new" && (
        <div>
          <FolderNameTextField />
          <FolderPathField workspace={workspace} />
          <Typography sx={{ my: 2 }}>Edit folder details (optional)</Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Description"
            name="description"
          />
        </div>
      )}
      {newOrExistingFolder == "existing" && (
        <FolderPathField workspace={workspace} />
      )}
    </div>
  );
}

function RoleAccess({
  iamRole,
  verbose,
}: {
  iamRole: IamRole;
  verbose?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {iamRole === IamRole.Discoverer && (
        <>
          <Icon color="error">error</Icon>
          Access required
        </>
      )}
      {roleContains(iamRole, IamRole.Reader) && (
        <>
          <Tooltip title={iamRole.charAt(0) + iamRole.slice(1).toLowerCase()}>
            <Icon color="success">check_circle</Icon>
          </Tooltip>
          {verbose && <>Granted</>}
        </>
      )}
    </Box>
  );
}

const StepDescription = (props: TypographyProps) => (
  <Typography {...props} sx={{ my: 2, ...props.sx }} />
);

function useCreateReferencesAction(workspace: WorkspaceDescription) {
  const { folderApi, resourceApi, referencedGcpResourceApi } = useApi();
  const { enqueueSnackbar } = useSnackbar();
  const resourceListReload = useResourceListReload();
  const folderListReload = useFolderListReload();
  return useCallback(
    (resources: ResourceDescription[], fields: Fields) =>
      (fields.newOrExistingFolder === "new"
        ? folderApi
            .createFolder({
              workspaceId: workspace.id,
              createFolderRequestBody: {
                displayName: fields.folderName,
                description: fields.description,
                parentFolderId: isRootFolder(fields.folderPath)
                  ? undefined
                  : fields.folderPath,
              },
            })
            .then((folder) => folder.id)
        : Promise.resolve(
            isRootFolder(fields.folderPath) ? undefined : fields.folderPath
          )
      )
        .then((folderId) =>
          Promise.allSettled(
            resources.map((r) => {
              if (r.metadata.stewardshipType !== StewardshipType.Referenced) {
                return Promise.reject(
                  new Error(
                    `Unable to clone resource stewardship ${r.metadata.stewardshipType}`
                  )
                );
              }
              const cloneProps = {
                workspaceId: r.metadata.workspaceId || "",
                resourceId: r.metadata.resourceId || "",
                cloneReferencedResourceRequestBody: {
                  destinationWorkspaceId: workspace.id,
                  cloningInstructions: CloningInstructionsEnum.Reference,
                },
              };
              const addToFolder = (r: {
                resource?: { metadata: ResourceMetadata };
              }) =>
                folderId
                  ? resourceApi.updateResourceProperties({
                      workspaceId: workspace.id,
                      resourceId: r.resource?.metadata.resourceId || "",
                      property: [
                        {
                          key: ResourcePropertyNames.FolderId,
                          value: folderId,
                        },
                      ],
                    })
                  : Promise.resolve();
              switch (r.metadata.resourceType) {
                case ResourceType.BigQueryDataset:
                  return referencedGcpResourceApi
                    .cloneGcpBigQueryDatasetReference(cloneProps)
                    .then(addToFolder);
                case ResourceType.BigQueryDataTable:
                  return referencedGcpResourceApi
                    .cloneGcpBigQueryDataTableReference(cloneProps)
                    .then(addToFolder);
                case ResourceType.GcsBucket:
                  return referencedGcpResourceApi
                    .cloneGcpGcsBucketReference(cloneProps)
                    .then(addToFolder);
                case ResourceType.GcsObject:
                  return referencedGcpResourceApi
                    .cloneGcpGcsObjectReference(cloneProps)
                    .then(addToFolder);
                case ResourceType.GitRepo:
                  return referencedGcpResourceApi
                    .cloneGitRepoReference(cloneProps)
                    .then(addToFolder);
                default:
                  return Promise.reject(
                    new Error(
                      `Unable to clone resource type ${r.metadata.resourceType}`
                    )
                  );
              }
            })
          )
        )
        .then((l) => {
          l.forEach((p) => {
            if (p.status === "rejected") {
              enqueueSnackbar(`Adding resource: ${errorMessage(p.reason)}`, {
                variant: "error",
              });
            }
          });
          resourceListReload(workspace.id);
          folderListReload(workspace.id);
        }),
    [
      enqueueSnackbar,
      folderApi,
      folderListReload,
      referencedGcpResourceApi,
      resourceApi,
      resourceListReload,
      workspace.id,
    ]
  );
}
