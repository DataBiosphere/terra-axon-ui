import { TextField, TextFieldProps } from "mui-rff";
import { useCallback } from "react";
import * as Yup from "yup";
import { useApi } from "./apiProvider";
import { AutoResourceIdField } from "./autoResourceIdField";

export const datasetNameHelperText =
  "Only use lowercase letters, numbers and underscores";

export function datasetNameField(required: boolean) {
  let field = Yup.string().label("Cloud dataset name");
  if (required) {
    field = field.required();
  }
  return datasetNameRules(field);
}

export function autoDatasetNameField() {
  return Yup.string()
    .label("Cloud dataset name")
    .when("name", ([name], schema) =>
      // Prevent "field is required" validation errors before the name is provided.
      name ? datasetNameRules(schema) : schema
    );
}

function datasetNameRules(schema: Yup.StringSchema) {
  return schema.max(1024).matches(/^[_a-z0-9]*$/, {
    excludeEmptyString: true,
    message: datasetNameHelperText,
  });
}

interface DatasetNameTextFieldProps extends Omit<TextFieldProps, "name"> {
  name?: string;
}

export function DatasetNameTextField(props: DatasetNameTextFieldProps) {
  return (
    <TextField
      // mui props.
      fullWidth
      margin="dense"
      label="Cloud dataset name"
      helperText={datasetNameHelperText}
      // mui-rff props.
      name="datasetName"
      {...props}
    />
  );
}

export interface AutoDatasetNameTextFieldProps
  extends DatasetNameTextFieldProps {
  workspaceId: string;
}

export function AutoDatasetNameTextField({
  workspaceId,
  ...props
}: AutoDatasetNameTextFieldProps) {
  const generateDatasetName = useGenerateDatasetName();
  const generateId = useCallback(
    (name: string) => generateDatasetName(workspaceId, name),
    [generateDatasetName, workspaceId]
  );
  return (
    <AutoResourceIdField
      required
      field="datasetName"
      generateId={generateId}
      Component={DatasetNameTextField}
      componentProps={{}}
      {...props}
    />
  );
}

export function useGenerateDatasetName() {
  const { controlledGcpResourceApi } = useApi();
  return useCallback(
    async (workspaceId: string, name: string) => {
      if (!name) return Promise.resolve("");
      const resp =
        await controlledGcpResourceApi.generateBigQueryDatasetCloudId({
          workspaceId: workspaceId,
          generateGcpBigQueryDatasetCloudIDRequestBody: {
            bigQueryDatasetName: name,
          },
        });
      return resp.generatedDatasetCloudId;
    },
    [controlledGcpResourceApi]
  );
}
