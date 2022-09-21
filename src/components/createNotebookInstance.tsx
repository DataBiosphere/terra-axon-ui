import { Button } from "@mui/material";
import arrayMutators from "final-form-arrays";
import { TextField } from "mui-rff";
import React, { ReactElement, useCallback } from "react";
import { Form } from "react-final-form";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import {
  AccessScope,
  CloningInstructionsEnum,
  ManagedBy,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { useJobAdded } from "./api/jobList";
import { useResourceListReload } from "./api/resourceList";
import { useApi } from "./apiProvider";
import { ErrorList } from "./errorhandler";
import {
  resourceNameField,
  resourceNameHelperText,
  toFinalFormError,
  validateFields,
} from "./fieldValidation";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import {
  AutoInstanceNameTextField,
  instanceNameField,
} from "./instanceNameField";
import { useJobs } from "./jobs";
import { LoadingBackdrop } from "./loadingBackdrop";
import useNotebookCustomImageAlertDialog from "./notebookCustomImageAlertDialog";

const schema = Yup.object({
  name: resourceNameField(),
  description: Yup.string(),
  instanceName: instanceNameField(),
  environment: Yup.string(),
});

type Fields = Yup.InferType<typeof schema>;

export interface CreateNotebookInstanceState {
  createNotebookInstance: ReactElement;
  show: () => void;
}

export interface CreateNotebookInstanceProps {
  workspace: WorkspaceDescription;
}

export function useCreateNotebookInstance({
  workspace,
}: CreateNotebookInstanceProps): CreateNotebookInstanceState {
  const createNotebook = useCreateNotebookAction(workspace);
  const formId = "createNotebookInstanceForm";
  const { alertDialog, dialogOpen, setDialogOpen } =
    useNotebookCustomImageAlertDialog({ formId: formId });
  const { flyover, setOpen } = useFlyover({
    title: "Create a new instance",
    children: (
      <Form
        onSubmit={(values: Fields) => {
          if (values.environment && !dialogOpen) {
            // If user defines custom image, a confirmation dialog is shown
            // first before submitting the request.
            setDialogOpen(true);
          } else {
            setDialogOpen(false);
            return createNotebook(values).then(
              () => setOpen(false),
              toFinalFormError
            );
          }
        }}
        validate={(values: Fields) => validateFields(schema, values)}
        mutators={{ ...arrayMutators }}
        render={({
          handleSubmit,
          submitting,
          hasValidationErrors,
          submitError,
        }) => (
          <form id={formId} noValidate onSubmit={handleSubmit}>
            <LoadingBackdrop open={submitting} />
            {alertDialog}
            <ErrorList errors={submitError} />
            <FlyoverContent>
              <TextField
                autoFocus
                required
                fullWidth
                margin="dense"
                name="name"
                label="Name"
                helperText={resourceNameHelperText}
              />
              <TextField
                fullWidth
                margin="dense"
                name="description"
                label="Description"
              />
              <AutoInstanceNameTextField workspaceId={workspace.id} />
              <TextField
                fullWidth
                margin="dense"
                name="environment"
                label="Custom environment location"
                placeholder="e.g., gcr.io/project_name/docker_image_name:tag1"
                helperText="Enter the location of the image in your repository. If you leave this blank, R 4.1 VM image will be used."
              />
            </FlyoverContent>
            <FlyoverActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={hasValidationErrors}
              >
                Create
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    ),
  });

  const show = useCallback(() => setOpen(true), [setOpen]);
  return { createNotebookInstance: flyover, show: show };
}

function useCreateNotebookAction(workspace: WorkspaceDescription) {
  const { addJob } = useJobs();
  const jobAdded = useJobAdded();
  const { controlledGcpResourceApi } = useApi();
  const resourceListReload = useResourceListReload();
  return useCallback(
    async (fields: Fields) => {
      const jobId = uuidv4();
      const environment = fields.environment;
      const repositoryAndTag = environment?.split(":");
      const created = await controlledGcpResourceApi.createAiNotebookInstance({
        workspaceId: workspace.id,
        createControlledGcpAiNotebookInstanceRequestBody: {
          common: {
            name: fields.name,
            description: fields.description || undefined,
            cloningInstructions: CloningInstructionsEnum.Nothing, // irrelevant, as notebooks can't be cloned
            accessScope: AccessScope.PrivateAccess,
            managedBy: ManagedBy.User,
          },
          aiNotebookInstance: {
            instanceId: fields.instanceName || undefined,
            machineType: "n1-standard-4",
            ...(repositoryAndTag && repositoryAndTag[0]
              ? {
                  containerImage: {
                    repository: repositoryAndTag[0],
                    tag: repositoryAndTag[1],
                  },
                }
              : {
                  vmImage: {
                    projectId: "deeplearning-platform-release",
                    imageFamily: "r-latest-cpu-experimental",
                  },
                }),
          },
          jobControl: { id: jobId },
        },
      });
      addJob({
        entityId: created.aiNotebookInstance?.metadata.resourceId || "",
        jobId: jobId,
        action: "creating notebook",
      });
      jobAdded(workspace.id);
      // TODO(PF-1351): Replace with resourceAdded once response contains the notebook.
      resourceListReload(workspace.id);
    },
    [
      controlledGcpResourceApi,
      workspace.id,
      addJob,
      jobAdded,
      resourceListReload,
    ]
  );
}
