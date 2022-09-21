import { Button } from "@mui/material";
import { TextField } from "mui-rff";
import { ReactElement, useCallback } from "react";
import { Form } from "react-final-form";
import * as Yup from "yup";
import {
  AccessScope,
  CloningInstructionsEnum,
  ManagedBy,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { useResourceAdded } from "./api/resourceList";
import { useApi } from "./apiProvider";
import {
  autoDatasetNameField,
  AutoDatasetNameTextField,
} from "./datasetNameField";
import { ErrorList } from "./errorhandler";
import {
  resourceNameField,
  toFinalFormError,
  validateFields,
} from "./fieldValidation";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { LoadingBackdrop } from "./loadingBackdrop";

const schema = Yup.object({
  name: resourceNameField(),
  description: Yup.string(),
  datasetName: autoDatasetNameField(),
});
type Fields = Yup.InferType<typeof schema>;

export interface CreateBigQueryDatasetState {
  createBigQueryDataset: ReactElement;
  show: () => void;
}

export interface CreateBigQueryDatasetProps {
  workspace: WorkspaceDescription;
}

export function useCreateBigQueryDataset({
  workspace,
}: CreateBigQueryDatasetProps): CreateBigQueryDatasetState {
  const createBigQueryDataset = useCreateBigQueryDatasetAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Create a new BigQuery dataset",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createBigQueryDataset(values).then(
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
              <AutoDatasetNameTextField workspaceId={workspace.id} />
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
  return { createBigQueryDataset: flyover, show: show };
}

function useCreateBigQueryDatasetAction(workspace: WorkspaceDescription) {
  const { controlledGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();
  return useCallback(
    (fields: Fields) =>
      controlledGcpResourceApi
        .createBigQueryDataset({
          workspaceId: workspace.id,
          createControlledGcpBigQueryDatasetRequestBody: {
            common: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Resource,
              accessScope: AccessScope.SharedAccess,
              managedBy: ManagedBy.User,
            },
            dataset: {
              // Comments indicate that the id field is actually the dataset name.
              datasetId: fields.datasetName || undefined,
            },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.bigQueryDataset.metadata,
            resourceAttributes: {
              gcpBqDataset: b.bigQueryDataset.attributes,
            },
          })
        ),
    [controlledGcpResourceApi, resourceAdded, workspace.id]
  );
}
