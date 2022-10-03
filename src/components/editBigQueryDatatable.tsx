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
import { datasetNameField, DatasetNameTextField } from "./datasetNameField";
import { ErrorList } from "./errorhandler";
import {
  dataTableNameField,
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
  dataTableName: dataTableNameField(),
  datasetName: datasetNameField(true),
  projectId: projectIdField(),
});
type Fields = Yup.InferType<typeof schema>;

export function useEditDatatableState(resource: ResourceDescription) {
  return usePopupState({
    variant: "dialog",
    popupId: `edit-datatable-${resource.metadata.resourceId}`,
  });
}

export interface EditDatatableProps extends Omit<FlyoverProps, "children"> {
  workspace: WorkspaceDescription;
  resource: ResourceDescription;
}

export function EditDatatable({
  workspace,
  resource,
  ...flyoverProps
}: EditDatatableProps) {
  const editDatatableAction = useEditDatatableAction(workspace, resource);

  return (
    <Flyover title="Edit the BigQuery data table" {...flyoverProps}>
      <Form
        onSubmit={(values: Fields) =>
          editDatatableAction(values).then(
            () => flyoverProps.onClose(),
            toFinalFormError
          )
        }
        initialValues={{
          name: resource.metadata.name || "",
          description: resource.metadata.description || "",
          dataTableName:
            resource.resourceAttributes.gcpBqDataTable?.dataTableId || "",
          datasetName:
            resource.resourceAttributes.gcpBqDataTable?.datasetId || "",
          projectId:
            resource.resourceAttributes.gcpBqDataTable?.projectId || "",
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
              <DatasetNameTextField required />
              <TextField
                required
                fullWidth
                margin="dense"
                label="Cloud data table name"
                name="dataTableName"
              />
              <TextField
                required
                fullWidth
                margin="dense"
                label="Project ID"
                name="projectId"
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

function useEditDatatableAction(
  workspace: WorkspaceDescription,
  resource: ResourceDescription
) {
  const { referencedGcpResourceApi } = useApi();
  const resourceUpdated = useResourceUpdated();
  return useCallback(
    async (fields: Fields) =>
      referencedGcpResourceApi
        .updateBigQueryDataTableReferenceResource({
          workspaceId: workspace.id,
          resourceId: resource.metadata.resourceId,
          updateBigQueryDataTableReferenceRequestBody: {
            name: fields.name,
            description: fields.description,
            projectId: fields.projectId,
            dataTableId: fields.dataTableName || "",
            datasetId: fields.datasetName || "",
          },
        })
        .then(() =>
          // TODO: Use response rather than fetching manually [PF-1987]
          referencedGcpResourceApi.getBigQueryDataTableReference({
            resourceId: resource.metadata.resourceId,
            workspaceId: workspace.id,
          })
        )
        .then((b) =>
          resourceUpdated({
            metadata: b.metadata,
            resourceAttributes: { gcpBqDataTable: b.attributes },
          })
        ),
    [
      referencedGcpResourceApi,
      resource.metadata.resourceId,
      workspace.id,
      resourceUpdated,
    ]
  );
}
