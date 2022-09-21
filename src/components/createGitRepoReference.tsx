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
import { ErrorList } from "./errorhandler";
import {
  gitRepoUrlField,
  resourceNameField,
  toFinalFormError,
  validateFields,
} from "./fieldValidation";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { LoadingBackdrop } from "./loadingBackdrop";

const schema = Yup.object({
  name: resourceNameField(),
  description: Yup.string(),
  url: gitRepoUrlField(),
});
type Fields = Yup.InferType<typeof schema>;

export interface CreateGitRepoReferenceState {
  createGitRepoReference: ReactElement;
  show: () => void;
}

export interface CreateGitRepoReferenceProps {
  workspace: WorkspaceDescription;
}

export function useCreateGitRepoReference({
  workspace,
}: CreateGitRepoReferenceProps): CreateGitRepoReferenceState {
  const createGitRepoReference = useCreateGitRepoReferenceAction(workspace);
  const { flyover, setOpen } = useFlyover({
    title: "Add a Git repository",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          createGitRepoReference(values).then(
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
                label="Repository URL"
                name="url"
                placeholder="e.g., git@<host>:<repo_path>/<repo>.git"
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
  return { createGitRepoReference: flyover, show: show };
}

function useCreateGitRepoReferenceAction(workspace: WorkspaceDescription) {
  const { referencedGcpResourceApi } = useApi();
  const resourceAdded = useResourceAdded();
  return useCallback(
    (fields: Fields) =>
      referencedGcpResourceApi
        .createGitRepoReference({
          workspaceId: workspace.id,
          createGitRepoReferenceRequestBody: {
            metadata: {
              name: fields.name,
              description: fields.description || undefined,
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            gitrepo: {
              gitRepoUrl: fields.url,
            },
          },
        })
        .then((b) =>
          resourceAdded({
            metadata: b.metadata,
            resourceAttributes: { gitRepo: b.attributes },
          })
        ),
    [referencedGcpResourceApi, resourceAdded, workspace.id]
  );
}
