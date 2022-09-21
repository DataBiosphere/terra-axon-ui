import { Button } from "@mui/material";
import { TextField } from "mui-rff";
import { ReactElement, useCallback } from "react";
import { Form } from "react-final-form";
import * as Yup from "yup";
import {
  CloningInstructionsEnum,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { useResourceAdded } from "./api/resourceList";
import { useApi } from "./apiProvider";
import { datasetNameField, DatasetNameTextField } from "./datasetNameField";
import { ErrorList } from "./errorhandler";
import {
  dataTableNameField,
  projectIdField,
  resourceNameField,
  toFinalFormError,
  validateFields,
} from "./fieldValidation";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { LoadingBackdrop } from "./loadingBackdrop";

const schema = Yup.object({
  name: resourceNameField(),
  description: Yup.string(),
  dataTableName: dataTableNameField(),
  datasetName: datasetNameField(true),
  projectId: projectIdField(),
});
type Fields = Yup.InferType<typeof schema>;

export interface CreateBigQueryDataTableReferenceState {
  createBigQueryDataTableReference: ReactElement;
  show: () => void;
}

export interface CreateBigQueryDataTableReferenceProps {
  workspace: WorkspaceDescription;
}

export function useCreateBigQueryDataTableReference({
  workspace,
}: CreateBigQueryDataTableReferenceProps): CreateBigQueryDataTableReferenceState {
  const createBigQueryDataTableReference =
    useCreateBigQueryDataTableReferenceAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Add a BigQuery data table",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createBigQueryDataTableReference(values).then(
            () => setOpen(false),
            toFinalFormError
          )
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
              <ErrorList errors={submitError} />
              <TextField
                autoFocus
                required
                fullWidth
                margin="dense"
                label="Name"
                name="name"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Description"
                name="description"
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
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={hasValidationErrors}
              >
                Add
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    ),
  });

  const show = useCallback(() => setOpen(true), [setOpen]);
  return { createBigQueryDataTableReference: flyover, show: show };
}

function useCreateBigQueryDataTableReferenceAction(
  workspace: WorkspaceDescription
) {
  const { referencedGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();
  return useCallback(
    (fields: Fields) =>
      referencedGcpResourceApi
        .createBigQueryDataTableReference({
          workspaceId: workspace.id,
          createGcpBigQueryDataTableReferenceRequestBody: {
            metadata: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            dataTable: {
              projectId: fields.projectId,
              dataTableId: fields.dataTableName || "",
              datasetId: fields.datasetName || "",
            },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.metadata,
            resourceAttributes: { gcpBqDataTable: b.attributes },
          })
        ),
    [referencedGcpResourceApi, resourceAdded, workspace.id]
  );
}
