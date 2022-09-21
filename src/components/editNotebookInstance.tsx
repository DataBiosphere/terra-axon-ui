import { Button, TextField as MuiTextField } from "@mui/material";
import arrayMutators from "final-form-arrays";
import { usePopupState } from "material-ui-popup-state/hooks";
import { TextField } from "mui-rff";
import React, { useCallback } from "react";
import { Form } from "react-final-form";
import * as Yup from "yup";
import {
  ResourceDescription,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { Instance } from "../lib/cloud/notebooks";
import { useResourceUpdated } from "./api/resourceList";
import { useApi } from "./apiProvider";
import { ErrorList } from "./errorhandler";
import {
  resourceNameField,
  resourceNameHelperText,
  toFinalFormError,
  validateFields,
} from "./fieldValidation";
import {
  Flyover,
  FlyoverActions,
  FlyoverContent,
  FlyoverProps,
} from "./flyover";
import { LoadingBackdrop } from "./loadingBackdrop";

const schema = Yup.object({
  name: resourceNameField(),
  description: Yup.string(),
});
type Fields = Yup.InferType<typeof schema>;

export function useEditNotebookState(resource: ResourceDescription) {
  return usePopupState({
    variant: "dialog",
    popupId: `edit-notebook-${resource.metadata.resourceId}`,
  });
}

export interface EditNotebookInstanceProps
  extends Omit<FlyoverProps, "children"> {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
  instance?: Instance;
}

export function EditNotebookInstance({
  workspace,
  resource,
  instance,
  ...flyoverProps
}: EditNotebookInstanceProps) {
  const editNotebookAction = useEditNotebookAction(workspace, resource);

  const repository = instance?.containerImage?.repository;
  const tag = instance?.containerImage?.tag;
  const repositoryAndTag = [repository, tag].filter(Boolean).join(":");

  return (
    <Flyover title="Edit the instance" {...flyoverProps}>
      <Form
        onSubmit={(values: Fields) =>
          editNotebookAction(values).then(
            () => flyoverProps.onClose(),
            toFinalFormError
          )
        }
        initialValues={{
          name: resource.metadata.name,
          description: resource.metadata.description || "",
        }}
        validate={(values: Fields) => validateFields(schema, values)}
        mutators={{ ...arrayMutators }}
        render={({
          handleSubmit,
          submitting,
          hasValidationErrors,
          submitError,
          dirty,
        }) => (
          <form noValidate onSubmit={handleSubmit}>
            <LoadingBackdrop open={submitting} />
            <ErrorList errors={submitError} />
            <FlyoverContent>
              <TextField
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
              <MuiTextField
                disabled
                fullWidth
                margin="dense"
                name="InstanceName"
                defaultValue={
                  resource.resourceAttributes.gcpAiNotebookInstance?.instanceId
                }
                label="Cloud instance name"
              />
              <MuiTextField
                disabled
                fullWidth
                margin="dense"
                name="customEnvironment"
                defaultValue={repositoryAndTag}
                label="Custom environment location"
              />
            </FlyoverContent>
            <FlyoverActions>
              <Button onClick={flyoverProps.onClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={hasValidationErrors || !dirty}
              >
                Update
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    </Flyover>
  );
}

function useEditNotebookAction(
  workspace: WorkspaceDescription,
  resource: ResourceDescription
) {
  const { controlledGcpResourceApi } = useApi();
  const resourceUpdated = useResourceUpdated();
  return useCallback(
    async (fields: Fields) =>
      controlledGcpResourceApi
        .updateAiNotebookInstance({
          workspaceId: workspace.id,
          resourceId: resource.metadata.resourceId,
          updateControlledGcpAiNotebookInstanceRequestBody: {
            name: fields.name,
            description: fields.description,
          },
        })
        .then((b) =>
          resourceUpdated({
            metadata: b.metadata,
            resourceAttributes: { gcpAiNotebookInstance: b.attributes },
          })
        ),
    [
      controlledGcpResourceApi,
      resource.metadata.resourceId,
      workspace.id,
      resourceUpdated,
    ]
  );
}
