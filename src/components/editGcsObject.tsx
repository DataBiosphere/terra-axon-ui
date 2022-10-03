import { Button } from "@mui/material";
import { usePopupState } from "material-ui-popup-state/hooks";
import { TextField } from "mui-rff";
import React, { useCallback } from "react";
import { Form } from "react-final-form";
import * as Yup from "yup";
import {
  ResourceDescription,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { useResourceUpdated } from "./api/resourceList";
import { useApi } from "./apiProvider";
import {
  bucketObjectNameField,
  parseObjectBucket,
} from "./cloudStorageObjectField";
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
  bucketObjectName: bucketObjectNameField(),
});
type Fields = Yup.InferType<typeof schema>;

export function useEditGcsObjectState(resource: ResourceDescription) {
  return usePopupState({
    variant: "dialog",
    popupId: `edit-object-${resource.metadata.resourceId}`,
  });
}

export interface EditGcsObjectProps extends Omit<FlyoverProps, "children"> {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
}

export function EditGcsObject({
  workspace,
  resource,
  ...flyoverProps
}: EditGcsObjectProps) {
  const editGcsObjectAction = useEditGcsObjectAction(workspace, resource);

  return (
    <Flyover title="Edit the cloud storage object" {...flyoverProps}>
      <Form
        onSubmit={(values: Fields) =>
          editGcsObjectAction(values).then(
            () => flyoverProps.onClose(),
            toFinalFormError
          )
        }
        initialValues={{
          name: resource.metadata.name || "",
          description: resource.metadata.description || "",
          bucketObjectName: `gs://${resource.resourceAttributes.gcpGcsObject?.bucketName}/${resource.resourceAttributes.gcpGcsObject?.fileName}`,
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
                name="bucketObjectName"
                label="Cloud object URL"
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

function useEditGcsObjectAction(
  workspace: WorkspaceDescription,
  resource: ResourceDescription
) {
  const { referencedGcpResourceApi } = useApi();
  const resourceUpdated = useResourceUpdated();
  return useCallback(
    async (fields: Fields) => {
      const { bucketName, objectName } = parseObjectBucket(
        fields.bucketObjectName
      );
      return referencedGcpResourceApi
        .updateBucketObjectReferenceResource({
          workspaceId: workspace.id,
          resourceId: resource.metadata.resourceId,
          updateGcsBucketObjectReferenceRequestBody: {
            name: fields.name,
            description: fields.description,
            bucketName: bucketName,
            objectName: objectName,
          },
        })
        .then(() =>
          // TODO: Use response rather than fetching manually [PF-1987]
          referencedGcpResourceApi.getGcsObjectReference({
            resourceId: resource.metadata.resourceId,
            workspaceId: workspace.id,
          })
        )
        .then((b) =>
          resourceUpdated({
            metadata: b.metadata,
            resourceAttributes: { gcpGcsObject: b.attributes },
          })
        );
    },
    [
      referencedGcpResourceApi,
      resource.metadata.resourceId,
      workspace.id,
      resourceUpdated,
    ]
  );
}
