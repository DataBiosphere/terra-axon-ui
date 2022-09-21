import {
  Alert,
  Box,
  Button,
  Icon,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  TypographyProps,
} from "@mui/material";
import { ReactElement, useCallback, useState } from "react";
import { Field, Form } from "react-final-form";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import {
  CloningInstructionsEnum,
  ResourceDescription,
  ResourceType,
  StewardshipType,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { useResourceList } from "./api/resourceList";
import { useWorkspaceAdded } from "./api/workspace";
import { useApi } from "./apiProvider";
import { ErrorList } from "./errorhandler";
import { toFinalFormError, validateFields } from "./fieldValidation";
import { FixedStepConnector } from "./fixedStepConnector";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { GitRepoLink } from "./gitRepoLink";
import { useJobs } from "./jobs";
import { LoadingBackdrop } from "./loadingBackdrop";
import { MarkdownEditor } from "./markdownEditor";
import { NoWrapCell } from "./noWrapCell";
import { OverflowTooltip } from "./overflowTooltip";
import { ResourceIcon, resourceTypeToString } from "./resourceIcon";
import {
  ResourceTableControl,
  ResourceTablePagination,
  ResourceTableSortField,
} from "./resourceTableControl";
import {
  WorkspaceGeneratedIdTextField,
  workspaceIdField,
} from "./workspaceIdField";
import {
  workspaceNameField,
  WorkspaceNameTextField,
} from "./workspaceNameField";

const schema = Yup.object({
  name: workspaceNameField(),
  id: workspaceIdField(),
  description: Yup.string(),
});
type Fields = Yup.InferType<typeof schema>;

export interface CloneWorkspaceState {
  cloneWorkspace: ReactElement;
  show: () => void;
}

export interface CloneWorkspaceProps {
  workspace: WorkspaceDescription;
  resources: ResourceDescription[];
}

export function useCloneWorkspace({
  workspace,
  resources,
}: CloneWorkspaceProps): CloneWorkspaceState {
  const cloneWorkspace = useCloneWorkspaceAction();
  const history = useHistory();

  const steps = {
    "Provide details": DetailsStep,
    "Review resouces": ResourcesStep,
    "Write a description": DescriptionStep,
  };
  const [step, setStep] = useState(0);
  const isFirstStep = step === 0;
  const isLastStep = step === Object.keys(steps).length - 1;
  const StepContents = Object.values(steps)[step];

  const { flyover, setOpen } = useFlyover({
    title: "Duplicate a workspace",
    children: (
      <Form
        onSubmit={
          isLastStep
            ? (values: Fields) =>
                cloneWorkspace(workspace, values).then(() => {
                  setOpen(false);
                  history.push({ pathname: "/workspaces/" + values.id });
                }, toFinalFormError)
            : () => setStep(step + 1)
        }
        initialValues={{
          name: workspace.displayName && `${workspace.displayName} (Copy)`,
          description: workspace.description,
        }}
        validate={(values: Fields) => validateFields(schema, values)}
        render={({
          handleSubmit,
          submitting,
          hasValidationErrors,
          submitError,
        }) => (
          <form noValidate onSubmit={handleSubmit}>
            <LoadingBackdrop open={submitting} />
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
              <StepContents workspace={workspace} resources={resources} />
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
                {isLastStep ? "Duplicate" : "Next"}
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    ),
  });

  const show = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, [setOpen]);
  return { cloneWorkspace: flyover, show: show };
}

export interface CloneWorkspaceResourceLoadState {
  cloneWorkspace: ReactElement;
  run: () => void;
}

export interface CloneWorkspaceResourceLoadProps {
  workspace: WorkspaceDescription;
}

export function useCloneWorkspaceResourceLoad({
  workspace,
}: CloneWorkspaceResourceLoadProps): CloneWorkspaceResourceLoadState {
  const [load, setLoad] = useState(false);

  const { data: resources, error } = useResourceList(
    load ? workspace.id : undefined
  );

  const { cloneWorkspace: cloneWorkspace, show: showCloneWorkspace } =
    useCloneWorkspace({ workspace, resources: resources || [] });

  return {
    cloneWorkspace: (
      <>
        <LoadingBackdrop open={load && !resources && !error} />
        {cloneWorkspace}
      </>
    ),
    run: () => {
      showCloneWorkspace();
      setLoad(true);
    },
  };
}

interface StepProps {
  workspace: WorkspaceDescription;
  resources: ResourceDescription[];
}

const DetailsStep = ({ workspace }: StepProps) => (
  <div>
    <StepDescription>
      You’re duplicating the workspace{" "}
      <b>{workspace.displayName || workspace.id}</b>. This will create a copy of
      the workspace, including controlled and referenced resources, that you can
      then modify. Notebook instances are not cloned.
    </StepDescription>
    <WorkspaceNameTextField />
    <WorkspaceGeneratedIdTextField />
  </div>
);

const getCombinedType = (r: ResourceDescription) => {
  return `${stewardshipTypeText(r.metadata.stewardshipType)},
        ${resourceTypeToString(r.metadata.resourceType)}`;
};

interface CloneGitRepoTableProps {
  toShow: ResourceDescription[];
  toClone: ResourceDescription[];
}

const CloneGitRepoTable = ({ toShow, toClone }: CloneGitRepoTableProps) => (
  <ResourceTableControl resources={toShow} paginated>
    {({ sortedResources: sortedRepos }) => (
      <Table
        size="small"
        width="100%"
        sx={{
          tableLayout: "fixed",
          mx: -3, // Negative margin to undo the FlyoverComponent margin.
          width: "fit-content",
        }}
        aria-label="git-repo-table"
      >
        <TableHead>
          <TableRow>
            <TableCell width="30%">
              <ResourceTableSortField
                label="Git repository name"
                field="name"
              />
            </TableCell>
            <TableCell width="50%">URL</TableCell>
            <TableCell width="20%">Duplication setting</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRepos.map((repo) => {
            const metadata = repo.metadata || {};
            return (
              <TableRow key={metadata.resourceId}>
                <NoWrapCell>
                  <OverflowTooltip title={metadata.name} />
                </NoWrapCell>
                <NoWrapCell>
                  <GitRepoLink
                    url={repo.resourceAttributes.gitRepo?.gitRepoUrl}
                  />
                </NoWrapCell>

                <NoWrapCell>
                  <Box
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {toClone.includes(repo) ? (
                      <>
                        <Icon color="success">check_circle</Icon>
                        Included
                      </>
                    ) : (
                      <>
                        <Icon color="warning">warning</Icon>Excluded
                      </>
                    )}
                  </Box>
                </NoWrapCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <ResourceTablePagination />
          </TableRow>
        </TableFooter>
      </Table>
    )}
  </ResourceTableControl>
);

interface CloneResourceTableProps {
  toShow: ResourceDescription[];
  toClone: ResourceDescription[];
}

const CloneResourceTable = ({ toShow, toClone }: CloneResourceTableProps) => (
  <ResourceTableControl resources={toShow} paginated>
    {({ sortedResources }) => (
      <Table
        size="small"
        width="100%"
        sx={{
          tableLayout: "fixed",
          mx: -3, // Negative margin to undo the FlyoverComponent margin.
          width: "fit-content",
        }}
        aria-label="resource-table"
      >
        <TableHead>
          <TableRow>
            <TableCell width="5%" />
            <TableCell width="45%">
              <ResourceTableSortField
                field="name"
                label="Resource name"
              ></ResourceTableSortField>
            </TableCell>
            <TableCell width="30%">
              <ResourceTableSortField
                label="Resource type"
                id="resource-type"
                comparator={(a, b) =>
                  getCombinedType(a).localeCompare(getCombinedType(b))
                }
              ></ResourceTableSortField>
            </TableCell>
            <TableCell width="20%">Duplication Setting</TableCell>
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
                </NoWrapCell>
                <NoWrapCell sx={{ whiteSpace: "pre-line" }}>
                  {getCombinedType(resource)}
                </NoWrapCell>

                <NoWrapCell>
                  <Box
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {toClone.includes(resource) ? (
                      <>
                        <Icon color="success">check_circle</Icon>
                        Included
                      </>
                    ) : (
                      <>
                        <Icon color="warning">warning</Icon>Excluded
                      </>
                    )}
                  </Box>
                </NoWrapCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <ResourceTablePagination />
          </TableRow>
        </TableFooter>
      </Table>
    )}
  </ResourceTableControl>
);

const ResourcesStep = ({ resources }: StepProps) => {
  // Clone workspace resources
  const toShow = resources.filter(
    (r) =>
      ![ResourceType.AiNotebook, ResourceType.GitRepo].includes(
        r.metadata.resourceType
      )
  );
  const toClone = toShow.filter(
    (r) =>
      r.metadata.cloningInstructions &&
      r.metadata.cloningInstructions !== CloningInstructionsEnum.Nothing
  );
  const numReferenced = toClone.filter(
    (r) => r.metadata.stewardshipType === StewardshipType.Referenced
  ).length;
  const numControlled = toClone.length - numReferenced;

  // Clone git repositories references
  const toShowGit = resources.filter((r) =>
    [ResourceType.GitRepo].includes(r.metadata.resourceType)
  );

  const toCloneGit = toShowGit.filter(
    (r) =>
      r.metadata.cloningInstructions &&
      r.metadata.cloningInstructions !== CloningInstructionsEnum.Nothing
  );

  if (!toShow.length && !toShowGit.length) {
    return (
      <StepDescription>
        The workspace you are duplicating does not contain any resources.
      </StepDescription>
    );
  }

  return (
    <div>
      <Alert severity="warning">
        Controlled resources will cost money as soon as they’re duplicated
      </Alert>
      <StepDescription>
        Review the resources being duplicated before continuing. The workspace
        owner may have set some resources to be excluded from duplication.
      </StepDescription>
      <StepDescription>
        {`${toClone.length} resource${
          toClone.length === 1 ? "" : "s"
        } (${numControlled} controlled, ${numReferenced} referenced) will be included in the duplicate. See table below for more details of what will be included and excluded from the duplicate.`}
      </StepDescription>
      <Typography variant="h1">Git repository references</Typography>
      {toShowGit.length ? (
        <CloneGitRepoTable toShow={toShowGit} toClone={toCloneGit} />
      ) : (
        <StepDescription>
          This workspace does not include any git repository references.
        </StepDescription>
      )}
      <Typography variant="h1" paddingTop="5%">
        Workspace resources
      </Typography>
      {toShow.length ? (
        <CloneResourceTable toShow={toShow} toClone={toClone} />
      ) : (
        <StepDescription>
          This workspace does not include any workspace resources.
        </StepDescription>
      )}
    </div>
  );
};

const stewardshipTypeText = (type?: StewardshipType) => {
  if (!type) return "";
  return type.charAt(0) + type.slice(1).toLowerCase();
};

const DescriptionStep = () => (
  <div>
    <StepDescription>
      A description can be helpful to describe the project you are working on,
      such as its purpose, and the data, metadata and tools you used in the
      analysis. The description can always be added or edited later.
    </StepDescription>
    <Field
      name="description"
      render={({ input }) => (
        <MarkdownEditor
          value={input.value}
          textareaProps={{ "aria-label": "Description" }}
          onChange={(s) => input.onChange(s)}
        />
      )}
    />
  </div>
);

const StepDescription = (props: TypographyProps) => (
  <Typography {...props} sx={{ my: 2, ...props.sx }} />
);

function useCloneWorkspaceAction() {
  const { addJob } = useJobs();
  const { workspaceApi } = useApi();
  const workspaceAdded = useWorkspaceAdded();
  return useCallback(
    async (workspace: WorkspaceDescription, fields: Fields) => {
      const cloned = await workspaceApi.cloneWorkspace({
        workspaceId: workspace.id,
        cloneWorkspaceRequest: {
          userFacingId: fields.id,
          displayName: fields.name,
          description: fields.description || undefined,
          spendProfile: "wm-default-spend-profile",
        },
      });
      const workspaceId = "TODO-get-cloned-id";
      const job = cloned.jobReport;
      if (job) {
        addJob({
          entityId: workspaceId,
          jobId: job.id,
          action: "cloning workspace",
        });
      }
      workspaceAdded();

      return cloned.workspace?.destinationWorkspaceId || "";
    },
    [workspaceApi, addJob, workspaceAdded]
  );
}
