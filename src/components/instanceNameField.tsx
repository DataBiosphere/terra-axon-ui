import { TextField, TextFieldProps } from "mui-rff";
import { useCallback } from "react";
import * as Yup from "yup";
import { useApi } from "./apiProvider";
import { AutoResourceIdField } from "./autoResourceIdField";

export const instanceNameHelperText =
  "Only use lowercase letters, numbers, and dashes";

export function instanceNameField() {
  return Yup.string()
    .label("Cloud instance name")
    .when("name", ([name], schema) =>
      // Prevent "field is required" validation errors before the name is provided.
      name
        ? schema
            .required()
            .max(63)
            .matches(/^[-a-z0-9]*$/, instanceNameHelperText)
            .matches(/^[a-z]/, {
              excludeEmptyString: true,
              message: "Must start with a lowercase letter",
            })
            .matches(/[a-z0-9]$/, {
              excludeEmptyString: true,
              message: "Must end with a lowercase letter or number",
            })
        : schema
    );
}

export interface AutoInstanceNameTextFieldProps {
  workspaceId: string;
}

export function AutoInstanceNameTextField({
  workspaceId,
}: AutoInstanceNameTextFieldProps) {
  const generateInstanceName = useGenerateInstanceName();
  const generateId = useCallback(
    (name: string) => generateInstanceName(workspaceId, name),
    [generateInstanceName, workspaceId]
  );

  return (
    <AutoResourceIdField
      field="instanceName"
      generateId={generateId}
      Component={InstanceNameTextField}
    />
  );
}

type InstanceNameTextFieldProps = Omit<TextFieldProps, "name">;

export function InstanceNameTextField(props: InstanceNameTextFieldProps) {
  return (
    <TextField
      // mui props.
      required
      fullWidth
      margin="dense"
      label="Cloud instance name"
      helperText={instanceNameHelperText}
      // mui-rff props.
      name="instanceName"
      {...props}
    />
  );
}

export function useGenerateInstanceName() {
  const { controlledGcpResourceApi } = useApi();
  return useCallback(
    async (workspaceId: string, name: string) => {
      if (!name) return Promise.resolve("");
      const resp =
        await controlledGcpResourceApi.generateAiNotebookCloudInstanceId({
          workspaceId: workspaceId,
          generateGcpAiNotebookCloudIdRequestBody: { aiNotebookName: name },
        });
      return resp.generatedAiNotebookAiNotebookCloudId;
    },
    [controlledGcpResourceApi]
  );
}
