import {
  Box,
  Button,
  ButtonProps,
  Icon,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { ReactElement, useCallback, useState } from "react";
import { Field, Form } from "react-final-form";
import { useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import {
  CloudPlatform,
  WorkspaceStageModel,
} from "../generated/workspacemanager";
import { useJobAdded } from "./api/jobList";
import { useWorkspaceAdded } from "./api/workspace";
import { useApi } from "./apiProvider";
import { ErrorList } from "./errorhandler";
import { toFinalFormError, validateFields } from "./fieldValidation";
import { FixedStepConnector } from "./fixedStepConnector";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { useJobs } from "./jobs";
import { LoadingBackdrop } from "./loadingBackdrop";
import { MarkdownEditor } from "./markdownEditor";
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

export type CreateWorkspaceButtonProps = Omit<
  ButtonProps,
  "onClick" | "startIcon"
>;

export function CreateWorkspaceButton(
  buttonProps: CreateWorkspaceButtonProps
): ReactElement {
  const { createWorkspace, show } = useCreateWorkspace();
  return (
    <div>
      <Button startIcon={<Icon>add</Icon>} onClick={show} {...buttonProps}>
        New workspace
      </Button>
      {createWorkspace}
    </div>
  );
}

export interface CreateWorkspaceState {
  createWorkspace: ReactElement;
  show: () => void;
}

export function useCreateWorkspace(): CreateWorkspaceState {
  const createWorkspace = useCreateWorkspaceAction();
  const history = useHistory();

  const steps = {
    "Workspace details": DetailsStep,
    "Workspace description": DescriptionStep,
  };
  const [step, setStep] = useState(0);
  const isFirstStep = step === 0;
  const isLastStep = step === Object.keys(steps).length - 1;
  const StepContents = Object.values(steps)[step];

  const { flyover, setOpen } = useFlyover({
    title: "Create a new workspace",
    children: (
      <Form
        onSubmit={
          isLastStep
            ? (values: Fields) =>
                createWorkspace(values).then(() => {
                  setOpen(false);
                  history.push({ pathname: "/workspaces/" + values.id });
                }, toFinalFormError)
            : () => setStep(step + 1)
        }
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
              <StepContents />
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
                {isLastStep ? "Create" : "Next"}
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
  return { createWorkspace: flyover, show: show };
}

const DetailsStep = () => (
  <div>
    <Typography sx={{ my: 2 }}>
      You’re creating a new workspace. A workspace is a place for you to
      organize all of your data, resources, and references for a project, as
      well as to collaborate with others. All workspace storage is located in
      the United States.
    </Typography>
    <WorkspaceNameTextField />
    <WorkspaceGeneratedIdTextField />
  </div>
);

const DescriptionStep = () => (
  <div>
    <Typography sx={{ my: 2 }}>
      A description can be helpful to describe the project you are working on,
      such as its purpose, and the data, metadata and tools you used in the
      analysis. The description can always be added or edited later.
    </Typography>
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

function useCreateWorkspaceAction() {
  const { addJob } = useJobs();
  const jobAdded = useJobAdded();
  const { workspaceApi } = useApi();
  const workspaceAdded = useWorkspaceAdded();

  return useCallback(
    async (fields: Fields) => {
      const created = await workspaceApi.createWorkspace({
        createWorkspaceRequestBody: {
          id: uuidv4(),
          userFacingId: fields.id,
          displayName: fields.name,
          description: fields.description || undefined,
          stage: WorkspaceStageModel.McWorkspace,
          spendProfile: "wm-default-spend-profile",
        },
      });
      const jobId = uuidv4();
      await workspaceApi.createCloudContext({
        workspaceId: created.id,
        createCloudContextRequest: {
          cloudPlatform: CloudPlatform.Gcp,
          jobControl: { id: jobId },
        },
      });
      addJob({
        entityId: created.id,
        jobId: jobId,
        action: "creating workspace",
      });
      jobAdded(created.id);

      workspaceAdded();

      return created;
    },
    [workspaceApi, addJob, jobAdded, workspaceAdded]
  );
}
