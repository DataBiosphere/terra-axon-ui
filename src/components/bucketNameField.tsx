import { TextField, TextFieldProps } from "mui-rff";
import { useCallback } from "react";
import * as Yup from "yup";
import { StewardshipType } from "../generated/workspacemanager";
import { useApi } from "./apiProvider";
import { AutoResourceIdField } from "./autoResourceIdField";

export const bucketNameHelperText = (stewardship: StewardshipType) =>
  stewardship == StewardshipType.Referenced
    ? "Only use lowercase letters, numbers, underscores and dashes"
    : "Only use lowercase letters, numbers and dashes";

export function bucketNameField(stewardship: StewardshipType) {
  const field = Yup.string().label("Cloud bucket name").required();
  return bucketNameRules(field, stewardship);
}

export function autoBucketNameField() {
  return Yup.string()
    .label("Cloud bucket name")
    .when("name", ([name], schema) =>
      // Prevent "field is required" validation errors before the name is provided.
      name ? bucketNameRules(schema, StewardshipType.Controlled) : schema
    );
}

function bucketNameRules(
  schema: Yup.StringSchema,
  stewardship: StewardshipType
) {
  return schema
    .max(63)
    .min(3)
    .matches(
      // We don't allow creating buckets with underscores (because of Nextflow),
      // but we should still allow references to existing buckets.
      stewardship === StewardshipType.Referenced
        ? /^[-_\.a-z0-9]*$/ // In WSM: REFERENCED_BUCKET_NAME_VALIDATION_PATTERN
        : /^[-\.a-z0-9]*$/, // In WSM: CONTROLLED_BUCKET_NAME_VALIDATION_PATTERN
      bucketNameHelperText(stewardship)
    )
    .matches(/^[a-z0-9]/, {
      excludeEmptyString: true,
      message: "Must start with a lowercase letter or number",
    })
    .matches(/[a-z0-9]$/, {
      excludeEmptyString: true,
      message: "Must end with a lowercase letter or number",
    });
}

export interface BucketNameTextFieldProps extends Omit<TextFieldProps, "name"> {
  stewardship: StewardshipType;
}

export function BucketNameTextField({
  stewardship,
  ...props
}: BucketNameTextFieldProps) {
  return (
    <TextField
      // mui props.
      fullWidth
      margin="dense"
      label="Cloud bucket name"
      helperText={!props.disabled && bucketNameHelperText(stewardship)}
      // mui-rff props.
      name="bucketName"
      {...props}
    />
  );
}

export interface AutoBucketNameTextFieldProps
  extends Omit<BucketNameTextFieldProps, "stewardship"> {
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
      field="bucketName"
      generateId={generateId}
      Component={BucketNameTextField}
      componentProps={{ stewardship: StewardshipType.Controlled }}
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
