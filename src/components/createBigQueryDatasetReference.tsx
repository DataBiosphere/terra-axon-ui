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
  datasetName: datasetNameField(true),
  projectId: projectIdField(),
});
type Fields = Yup.InferType<typeof schema>;

export interface CreateBigQueryDatasetReferenceState {
  createBigQueryDatasetReference: ReactElement;
  show: () => void;
}

export interface CreateBigQueryDatasetReferenceProps {
  workspace: WorkspaceDescription;
}

export function useCreateBigQueryDatasetReference({
  workspace,
}: CreateBigQueryDatasetReferenceProps): CreateBigQueryDatasetReferenceState {
  const createBigQueryDatasetReference =
    useCreateBigQueryDatasetReferenceAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Add a BigQuery dataset",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createBigQueryDatasetReference(values).then(
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
  return { createBigQueryDatasetReference: flyover, show: show };
}

function useCreateBigQueryDatasetReferenceAction(
  workspace: WorkspaceDescription
) {
  const { referencedGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();
  return useCallback(
    (fields: Fields) =>
      referencedGcpResourceApi
        .createBigQueryDatasetReference({
          workspaceId: workspace.id,
          createGcpBigQueryDatasetReferenceRequestBody: {
            metadata: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            dataset: {
              projectId: fields.projectId,
              datasetId: fields.datasetName || "",
            },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.metadata,
            resourceAttributes: { gcpBqDataset: b.attributes },
          })
        ),
    [referencedGcpResourceApi, resourceAdded, workspace.id]
  );
}
