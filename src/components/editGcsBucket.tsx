import { Button } from "@mui/material";
import { usePopupState } from "material-ui-popup-state/hooks";
import { TextField } from "mui-rff";
import React, { useCallback } from "react";
import { Form } from "react-final-form";
import * as Yup from "yup";
import {
  ResourceDescription,
  StewardshipType,
  WorkspaceDescription,
} from "../generated/workspacemanager";
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
  bucketName: resourceNameField(),
});
type Fields = Yup.InferType<typeof schema>;

export function useEditGcsBucketState(resource: ResourceDescription) {
  return usePopupState({
    variant: "dialog",
    popupId: `edit-bucket-${resource.metadata.resourceId}`,
  });
}

export interface EditGcsBucketProps extends Omit<FlyoverProps, "children"> {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
}

export function EditGcsBucket({
  workspace,
  resource,
  ...flyoverProps
}: EditGcsBucketProps) {
  const editGcsBucketAction = useEditGcsBucketAction(workspace, resource);

  return (
    <Flyover title="Edit the cloud storage bucket" {...flyoverProps}>
      <Form
        onSubmit={(values: Fields) =>
          editGcsBucketAction(values).then(
            () => flyoverProps.onClose(),
            toFinalFormError
          )
        }
        initialValues={{
          name: resource.metadata.name || "",
          description: resource.metadata.description || "",
          bucketName:
            resource.resourceAttributes.gcpGcsBucket?.bucketName || "",
        }}
        validate={(values: Fields) => validateFields(schema, values)}
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
              <TextField
                fullWidth
                margin="dense"
                name="bucketName"
                label="Cloud Bucket Name"
                disabled={
                  resource.metadata.stewardshipType ==
                  StewardshipType.Controlled
                }
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

function useEditGcsBucketAction(
  workspace: WorkspaceDescription,
  resource: ResourceDescription
) {
  const { controlledGcpResourceApi, referencedGcpResourceApi } = useApi();
  const resourceUpdated = useResourceUpdated();
  return useCallback(
    async (fields: Fields) =>
      resource.metadata.stewardshipType == StewardshipType.Controlled
        ? controlledGcpResourceApi
            .updateGcsBucket({
              workspaceId: workspace.id,
              resourceId: resource.metadata.resourceId,
              updateControlledGcpGcsBucketRequestBody: {
                name: fields.name,
                description: fields.description,
              },
            })
            .then((b) =>
              resourceUpdated({
                metadata: b.metadata,
                resourceAttributes: { gcpGcsBucket: b.attributes },
              })
            )
        : referencedGcpResourceApi
            .updateBucketReferenceResource({
              workspaceId: workspace.id,
              resourceId: resource.metadata.resourceId,
              updateGcsBucketReferenceRequestBody: {
                name: fields.name,
                description: fields.description,
                bucketName: fields.bucketName,
              },
            })
            .then(() =>
              // TODO: Use response rather than fetching manually [PF-1987]
              referencedGcpResourceApi.getBucketReference({
                resourceId: resource.metadata.resourceId,
                workspaceId: workspace.id,
              })
            )
            .then((b) =>
              resourceUpdated({
                metadata: b.metadata,
                resourceAttributes: { gcpGcsBucket: b.attributes },
              })
            ),
    [
      controlledGcpResourceApi,
      referencedGcpResourceApi,
      resource.metadata.resourceId,
      resource.metadata.stewardshipType,
      workspace.id,
      resourceUpdated,
    ]
  );
}
