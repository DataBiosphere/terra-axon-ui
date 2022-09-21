import { Button, Icon } from "@mui/material";
import { ReactElement, useCallback } from "react";
import { Field, Form } from "react-final-form";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { IamRole, WorkspaceDescription } from "../generated/workspacemanager";
import { useWorkspaceUpdated } from "./api/workspace";
import { useApi } from "./apiProvider";
import { DisabledTooltip } from "./disabledTooltip";
import { ErrorList } from "./errorhandler";
import { toFinalFormError, validateFields } from "./fieldValidation";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { roleContains } from "./iamRole";
import { LoadingBackdrop } from "./loadingBackdrop";
import { MarkdownEditor } from "./markdownEditor";
import { workspaceIdField, WorkspaceIdTextField } from "./workspaceIdField";
import {
  workspaceNameField,
  WorkspaceNameTextField,
} from "./workspaceNameField";

const schema = Yup.object({
  name: workspaceNameField(),
  id: workspaceIdField(),
  description: Yup.string(),
});

type Fields = Yup.InferType<typeof schema>;

export interface EditWorkspaceState {
  editWorkspace: ReactElement;
  show: () => void;
}

export interface EditWorkspaceProps {
  workspace: WorkspaceDescription;
}

export function useEditWorkspace({
  workspace,
}: EditWorkspaceProps): EditWorkspaceState {
  const editWorkspace = useEditWorkspaceAction(workspace);

  const history = useHistory();

  const { flyover, setOpen } = useFlyover({
    title: "Edit workspace",
    children: (
      <Form
        onSubmit={(values: Fields) =>
          editWorkspace(values).then(() => {
            setOpen(false);
            history.replace({ pathname: "/workspaces/" + values.id });
          }, toFinalFormError)
        }
        validate={(values: Fields) => validateFields(schema, values)}
        initialValues={{
          name: workspace.displayName || "",
          id: workspace.userFacingId,
          description: workspace.description || "",
        }}
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
              <WorkspaceNameTextField />
              <WorkspaceIdTextField />
              <Field
                name="description"
                render={({ input }) => (
                  <MarkdownEditor
                    value={input.value}
                    textareaProps={{ "aria-label": "Description" }}
                    onChange={(s) => input.onChange(s)}
                  />
                )}
              />
            </FlyoverContent>
            <FlyoverActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={hasValidationErrors}
              >
                Update
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    ),
  });

  const show = useCallback(() => setOpen(true), [setOpen]);
  return { editWorkspace: flyover, show: show };
}

export interface EditWorkspaceButtonProps extends EditWorkspaceProps {
  iamRole: IamRole;
}

export function EditWorkspaceButton({
  iamRole,
  ...editWorkspaceProps
}: EditWorkspaceButtonProps): ReactElement {
  const { editWorkspace, show } = useEditWorkspace(editWorkspaceProps);
  return (
    <div>
      <DisabledTooltip title="You must be an Owner or Writer to edit a workspace">
        <Button
          variant="outlined"
          startIcon={<Icon>edit</Icon>}
          onClick={show}
          disabled={!roleContains(iamRole, IamRole.Writer)}
        >
          Edit
        </Button>
      </DisabledTooltip>
      {editWorkspace}
    </div>
  );
}

function useEditWorkspaceAction(workspace: WorkspaceDescription) {
  const { workspaceApi } = useApi();
  const workspaceUpdated = useWorkspaceUpdated();
  return useCallback(
    (fields: Fields) =>
      workspaceApi
        .updateWorkspace({
          workspaceId: workspace.id,
          updateWorkspaceRequestBody: {
            userFacingId: fields.id,
            displayName: fields.name,
            description: fields.description,
          },
        })
        .then(workspaceUpdated),
    [workspaceApi, workspace.id, workspaceUpdated]
  );
}
