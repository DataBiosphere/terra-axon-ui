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
  autoBucketNameField,
  AutoBucketNameTextField,
} from "./bucketNameField";
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
  bucketName: autoBucketNameField(),
});
type Fields = Yup.InferType<typeof schema>;

interface CreateBucketState {
  createBucket: ReactElement;
  show: () => void;
}

export interface CreateBucketProps {
  workspace: WorkspaceDescription;
}

export function useCreateBucket({
  workspace,
}: CreateBucketProps): CreateBucketState {
  const createBucket = useCreateBucketAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Create a new Cloud Storage bucket",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createBucket(values).then(() => setOpen(false), toFinalFormError)
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
              <AutoBucketNameTextField workspaceId={workspace.id} />
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
  return { createBucket: flyover, show: show };
}

function useCreateBucketAction(workspace: WorkspaceDescription) {
  const { controlledGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();
  return useCallback(
    (fields: Fields) =>
      controlledGcpResourceApi
        .createBucket({
          workspaceId: workspace.id,
          createControlledGcpGcsBucketRequestBody: {
            common: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Resource,
              accessScope: AccessScope.SharedAccess,
              managedBy: ManagedBy.User,
            },
            gcsBucket: {
              name: fields.bucketName || undefined,
            },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.gcpBucket.metadata,
            resourceAttributes: {
              gcpGcsBucket: b.gcpBucket.attributes,
            },
          })
        ),
    [controlledGcpResourceApi, resourceAdded, workspace.id]
  );
}
