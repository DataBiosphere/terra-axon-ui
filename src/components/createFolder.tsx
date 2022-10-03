import { Button } from "@mui/material";
import { usePopupState } from "material-ui-popup-state/hooks";
import { TextField } from "mui-rff";
import { Form } from "react-final-form";
import * as Yup from "yup";
import { WorkspaceDescription } from "../generated/workspacemanager";
import { useCreateFolderAction } from "./api/folder";
import { ErrorList } from "./errorhandler";
import { toFinalFormError, validateFields } from "./fieldValidation";
import {
  Flyover,
  FlyoverActions,
  FlyoverContent,
  FlyoverProps,
} from "./flyover";
import { folderNameField, FolderNameTextField } from "./folderNameField";
import {
  defaultFolderPath,
  folderPathField,
  FolderPathField,
  isRootFolder,
} from "./folderPathField";
import { LoadingBackdrop } from "./loadingBackdrop";

const schema = Yup.object({
  folderName: folderNameField(),
  folderPath: folderPathField(),
  description: Yup.string(),
});
type Fields = Yup.InferType<typeof schema>;

export function useCreateFolder() {
  return usePopupState({
    variant: "dialog",
    popupId: `create-folder`,
  });
}

export interface CreateFolderProps extends Omit<FlyoverProps, "children"> {
  workspace: WorkspaceDescription;
}

export function CreateFolder({
  workspace,
  ...flyoverProps
}: CreateFolderProps) {
  const createFolder = useCreateFolderAction();
  return (
    <Flyover title="New folder details" {...flyoverProps}>
      <Form
        initialValues={{ folderPath: defaultFolderPath() }}
        onSubmit={(values: Fields) =>
          createFolder(workspace.id, {
            displayName: values.folderName,
            description: values.description || undefined,
            parentFolderId: isRootFolder(values.folderPath)
              ? undefined
              : values.folderPath,
          }).then(() => flyoverProps.onClose(), toFinalFormError)
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
              <FolderNameTextField />
              <FolderPathField workspace={workspace} />
              <TextField
                fullWidth
                margin="dense"
                label="Description"
                name="description"
              />
            </FlyoverContent>
            <FlyoverActions>
              <Button onClick={flyoverProps.onClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={hasValidationErrors}
              >
                Create folder
              </Button>
            </FlyoverActions>
          </form>
        )}
      />
    </Flyover>
  );
}
