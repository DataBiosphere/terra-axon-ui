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
import {
  bucketObjectNameField,
  parseObjectBucket,
} from "./cloudStorageObjectField";
import { ErrorList } from "./errorhandler";
import {
  resourceNameField,
  toFinalFormError,
  validateFields,
} from "./fieldValidation";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { LoadingBackdrop } from "./loadingBackdrop";

export type Fields = Yup.InferType<typeof schema>;

const schema = Yup.object({
  name: resourceNameField(),
  description: Yup.string(),
  bucketObjectName: bucketObjectNameField(),
});

export interface CreateObjectReferenceState {
  createObjectReference: ReactElement;
  show: () => void;
}

export interface CreateObjectReferenceProps {
  workspace: WorkspaceDescription;
}

export function useCreateObjectReference({
  workspace,
}: CreateObjectReferenceProps): CreateObjectReferenceState {
  const createObjectReference = useCreateObjectReferenceAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Add a Cloud Storage object",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createObjectReference(values).then(
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
              <TextField
                required
                fullWidth
                margin="dense"
                label="Cloud object URL"
                name="bucketObjectName"
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
  return { createObjectReference: flyover, show: show };
}

function useCreateObjectReferenceAction(workspace: WorkspaceDescription) {
  const { referencedGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();

  return useCallback(
    (fields: Fields) => {
      const { bucketName, objectName } = parseObjectBucket(
        fields.bucketObjectName
      );

      return referencedGcpResourceApi
        .createGcsObjectReference({
          workspaceId: workspace.id,
          createGcpGcsObjectReferenceRequestBody: {
            metadata: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            file: {
              fileName: objectName || "",
              bucketName: bucketName || "",
            },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.metadata,
            resourceAttributes: { gcpGcsObject: b.attributes },
          })
        );
    },
    [referencedGcpResourceApi, resourceAdded, workspace.id]
  );
}
