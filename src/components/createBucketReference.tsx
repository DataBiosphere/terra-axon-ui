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
import { bucketNameField, BucketNameTextField } from "./bucketNameField";
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
  bucketName: bucketNameField(true),
});
type Fields = Yup.InferType<typeof schema>;

export interface CreateBucketReferenceState {
  createBucketReference: ReactElement;
  show: () => void;
}

export interface CreateBucketReferenceProps {
  workspace: WorkspaceDescription;
}

export function useCreateBucketReference({
  workspace,
}: CreateBucketReferenceProps): CreateBucketReferenceState {
  const createBucketReference = useCreateBucketReferenceAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Add a Cloud Storage bucket",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createBucketReference(values).then(
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
              <BucketNameTextField required />
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
  return { createBucketReference: flyover, show: show };
}

function useCreateBucketReferenceAction(workspace: WorkspaceDescription) {
  const { referencedGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();
  return useCallback(
    (fields: Fields) =>
      referencedGcpResourceApi
        .createBucketReference({
          workspaceId: workspace.id,
          createGcpGcsBucketReferenceRequestBody: {
            metadata: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            bucket: { bucketName: fields.bucketName || "" },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.metadata,
            resourceAttributes: { gcpGcsBucket: b.attributes },
          })
        ),
    [referencedGcpResourceApi, resourceAdded, workspace.id]
  );
}
