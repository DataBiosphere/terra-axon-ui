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
import { datasetNameField, DatasetNameTextField } from "./datasetNameField";
import { ErrorList } from "./errorhandler";
import {
  projectIdField,
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
  datasetName: datasetNameField(true),
  projectId: projectIdField(),
});
type Fields = Yup.InferType<typeof schema>;

export function useEditDatasetState(resource: ResourceDescription) {
  return usePopupState({
    variant: "dialog",
    popupId: `edit-dataset-${resource.metadata.resourceId}`,
  });
}

export interface EditDatasetProps extends Omit<FlyoverProps, "children"> {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
}

export function EditDataset({
  workspace,
  resource,
  ...flyoverProps
}: EditDatasetProps) {
  const editDatasetAction = useEditDatasetAction(workspace, resource);

  return (
    <Flyover title="Edit the BigQuery dataset" {...flyoverProps}>
      <Form
        onSubmit={(values: Fields) =>
          editDatasetAction(values).then(
            () => flyoverProps.onClose(),
            toFinalFormError
          )
        }
        initialValues={{
          name: resource.metadata.name || "",
          description: resource.metadata.description || "",
          datasetName:
            resource.resourceAttributes.gcpBqDataset?.datasetId || "",
          projectId: resource.resourceAttributes.gcpBqDataset?.projectId || "",
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
              <DatasetNameTextField
                required
                disabled={
                  resource.metadata.stewardshipType ==
                  StewardshipType.Controlled
                }
              />
              <TextField
                required
                fullWidth
                margin="dense"
                label="Project ID"
                name="projectId"
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

function useEditDatasetAction(
  workspace: WorkspaceDescription,
  resource: ResourceDescription
) {
  const { controlledGcpResourceApi, referencedGcpResourceApi } = useApi();
  const resourceUpdated = useResourceUpdated();
  return useCallback(
    async (fields: Fields) =>
      resource.metadata.stewardshipType == StewardshipType.Controlled
        ? controlledGcpResourceApi
            .updateBigQueryDataset({
              workspaceId: workspace.id,
              resourceId: resource.metadata.resourceId,
              updateControlledGcpBigQueryDatasetRequestBody: {
                name: fields.name,
                description: fields.description,
              },
            })
            .then((b) =>
              resourceUpdated({
                metadata: b.metadata,
                resourceAttributes: { gcpBqDataset: b.attributes },
              })
            )
        : referencedGcpResourceApi
            .updateBigQueryDatasetReferenceResource({
              workspaceId: workspace.id,
              resourceId: resource.metadata.resourceId,
              updateBigQueryDatasetReferenceRequestBody: {
                name: fields.name,
                description: fields.description,
                datasetId: fields.datasetName,
                projectId: fields.projectId,
              },
            })
            .then(() =>
              // TODO: Use response rather than fetching manually [PF-1987]
              referencedGcpResourceApi.getBigQueryDatasetReference({
                resourceId: resource.metadata.resourceId,
                workspaceId: workspace.id,
              })
            )
            .then((b) =>
              resourceUpdated({
                metadata: b.metadata,
                resourceAttributes: { gcpBqDataset: b.attributes },
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
