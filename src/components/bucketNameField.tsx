import { TextField, TextFieldProps } from "mui-rff";
import { useCallback } from "react";
import * as Yup from "yup";
import { useApi } from "./apiProvider";
import { AutoResourceIdField } from "./autoResourceIdField";

export const bucketNameHelperText =
  "Only use lowercase letters, numbers, underscores and dashes";

export function bucketNameField(required: boolean) {
  let field = Yup.string().label("Cloud bucket name");
  if (required) {
    field = field.required();
  }
  return bucketNameRules(field);
}

export function autoBucketNameField() {
  return Yup.string()
    .label("Cloud bucket name")
    .when("name", ([name], schema) =>
      // Prevent "field is required" validation errors before the name is provided.
      name ? bucketNameRules(schema) : schema
    );
}

function bucketNameRules(schema: Yup.StringSchema) {
  return schema
    .max(63)
    .min(3)
    .matches(/^[-_\.a-z0-9]*$/, bucketNameHelperText)
    .matches(/^[a-z0-9]/, {
      excludeEmptyString: true,
      message: "Must start with a lowercase letter or number",
    })
    .matches(/[a-z0-9]$/, {
      excludeEmptyString: true,
      message: "Must end with a lowercase letter or number",
    });
}

type BucketNameTextFieldProps = Omit<TextFieldProps, "name">;

export function BucketNameTextField(props: BucketNameTextFieldProps) {
  return (
    <TextField
      // mui props.
      fullWidth
      margin="dense"
      label="Cloud bucket name"
      helperText={bucketNameHelperText}
      // mui-rff props.
      name="bucketName"
      {...props}
    />
  );
}

export interface AutoBucketNameTextFieldProps extends BucketNameTextFieldProps {
  workspaceId: string;
}

export function AutoBucketNameTextField({
  workspaceId,
  ...props
}: AutoBucketNameTextFieldProps) {
  const generateBucketName = useGenerateBucketName();
  const generateId = useCallback(
    (name: string) => generateBucketName(workspaceId, name),
    [generateBucketName, workspaceId]
  );
  return (
    <AutoResourceIdField
      required
      field="bucketName"
      generateId={generateId}
      Component={BucketNameTextField}
      {...props}
    />
  );
}

export function useGenerateBucketName() {
  const { controlledGcpResourceApi } = useApi();
  return useCallback(
    async (workspaceId: string, name: string) => {
      if (!name) return Promise.resolve("");
      const resp = await controlledGcpResourceApi.generateGcpGcsBucketCloudName(
        {
          workspaceId: workspaceId,
          generateGcpGcsBucketCloudNameRequestBody: { gcsBucketName: name },
        }
      );
      return resp.generatedBucketCloudName;
    },
    [controlledGcpResourceApi]
  );
}
