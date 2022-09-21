import { TextField } from "mui-rff";
import * as Yup from "yup";

export function workspaceNameField() {
  return Yup.string().label("name").required();
}

export function WorkspaceNameTextField() {
  return (
    <TextField
      autoFocus
      required
      fullWidth
      margin="dense"
      label="Name"
      name="name"
      placeholder="e.g., My New Workspace"
      helperText="The name is only used within Terra. It can include special characters"
    />
  );
}
