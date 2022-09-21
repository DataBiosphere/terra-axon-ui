import { Icon, IconButton, InputAdornment } from "@mui/material";
import { StatusCodes } from "http-status-codes";
import { TextField, TextFieldProps } from "mui-rff";
import { useCallback, useState } from "react";
import { useAsync } from "react-async";
import { useField, useForm, useFormState } from "react-final-form";
import * as Yup from "yup";
import { errorCode } from "../lib/api/error";
import { useApi } from "./apiProvider";

export function workspaceIdField() {
  return Yup.string()
    .label("id")
    .when("name", ([name], schema) =>
      // Prevent "ID is required" validation errors before the name is provided.
      name
        ? schema
            .required("Provide an ID")
            .min(3)
            .max(63)
            .matches(
              /^[-_a-z0-9]*$/,
              "Only use lowercase letters, numbers, dashes, and underscores"
            )
            .matches(
              /^[a-z0-9]/,
              "Must start with a lowercase letter or number"
            )
        : schema
    );
}

export function useValidateUniqueId() {
  const isIdUnique = useIsIdUnique();
  return useCallback(
    async (id?: string): Promise<string | undefined> => {
      const unique = await isIdUnique(id);
      if (unique) {
        return undefined;
      }
      return "This ID already exists. Must be unique.";
    },
    [isIdUnique]
  );
}

export function WorkspaceGeneratedIdTextField() {
  const [generatedId, setGeneratedId] = useState("");
  const [suffix] = useState(
    () => "-" + Math.random().toString().substring(2, 6)
  );

  const [name, setName] = useState("");
  useFormState({
    onChange: (state: { values: { name: string | undefined } }) =>
      setName(state.values.name || ""),
  });

  const isIdUnique = useIsIdUnique();
  useAsync({
    promiseFn: useCallback(async () => {
      const id = generateIdFromName(name);
      const unique = await isIdUnique(id);
      if (unique) return id;
      // This may not be unique, but the probability is low enough to leave
      // to server side validation.
      return id + suffix;
    }, [isIdUnique, name, suffix]),
    onResolve: setGeneratedId,
  });

  const formApi = useForm();
  const fieldApi = useField("id");

  return (
    <WorkspaceIdTextField
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => {
                fieldApi.input.onChange(generatedId);
                formApi.resetFieldState("id");
              }}
            >
              <Icon>refresh</Icon>
            </IconButton>
          </InputAdornment>
        ),
      }}
      fieldProps={{
        defaultValue: generatedId,
        initialValue: generatedId,
      }}
    />
  );
}

interface WorkspaceIdTextFieldProps extends Omit<TextFieldProps, "name"> {
  name?: string;
}

export function WorkspaceIdTextField(props: WorkspaceIdTextFieldProps) {
  const validateUniqueId = useValidateUniqueId();

  const { fieldProps, ...textFieldProps } = props;

  return (
    <TextField
      // mui props.
      required
      fullWidth
      margin="dense"
      label="ID"
      placeholder="Tip: Enter a name first"
      helperText="Must be unique. Only use lowercase letters, numbers, dashes, and underscores"
      // mui-rff props.
      name="id"
      fieldProps={{
        ...fieldProps,
        validate: async (value, _, meta) => {
          // If the field is unchanged, then don't perform a unique ID check.
          if (meta?.pristine) {
            return undefined;
          } else {
            return await validateUniqueId(value);
          }
        },
      }}
      {...textFieldProps}
    />
  );
}

export function useIsIdUnique() {
  const { workspaceApi } = useApi();
  return useCallback(
    async (id?: string) => {
      if (!id) return Promise.resolve(true);
      return await workspaceApi
        .getWorkspaceByUserFacingId({ workspaceUserFacingId: id || "" })
        .then(
          () => false,
          (e: unknown) => {
            switch (errorCode(e)) {
              case StatusCodes.NOT_FOUND:
                return true;
              case StatusCodes.FORBIDDEN:
                return false;
              default:
                throw e;
            }
          }
        );
    },
    [workspaceApi]
  );
}

export function generateIdFromName(name: string) {
  return (
    name
      .toLowerCase()
      // Replace invalid characters with a dash.
      .replaceAll(/[^_a-z0-9]+/g, "-")
      // Remove dashes and underscores from the start.
      .replace(/^[-_]+/, "")
      // Remove dashes from the end.
      .replace(/-+$/, "")
      // Limit ID to 63 chars.
      .substring(0, 63)
  );
}
