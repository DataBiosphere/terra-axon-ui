import { TextField, TextFieldProps } from "mui-rff";
import * as Yup from "yup";

export function folderNameField() {
  return Yup.string().label("folder name").required();
}

type FolderNameTextFieldProps = Omit<TextFieldProps, "name">;

export function FolderNameTextField(props: FolderNameTextFieldProps) {
  return (
    <TextField
      // mui props.
      required
      fullWidth
      margin="dense"
      label="Folder name"
      // mui-rff props.
      name="folderName"
      {...props}
    />
  );
}
