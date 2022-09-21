import { Icon, IconButton, InputAdornment } from "@mui/material";
import { TextField } from "mui-rff";
import { useCallback, useState } from "react";
import { useAsync } from "react-async";
import { useField, useForm, useFormState } from "react-final-form";

export interface AutoResourceIdFieldProps {
  field: string;
  generateId: (name: string) => Promise<string>;
  Component: typeof TextField;
}

export function AutoResourceIdField({
  field,
  generateId,
  Component,
}: AutoResourceIdFieldProps) {
  const [name, setName] = useState("");
  useFormState({
    onChange: (state: { values: { name: string | undefined } }) =>
      setName(state.values.name || ""),
  });

  const [autoId, setAutoId] = useState("");
  useAsync({
    promiseFn: useCallback(() => generateId(name), [generateId, name]),
    onResolve: setAutoId,
  });

  const formApi = useForm();
  const fieldApi = useField(field);

  return (
    <Component
      // mui props.
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => {
                fieldApi.input.onChange(autoId);
                formApi.resetFieldState(field);
              }}
            >
              <Icon>refresh</Icon>
            </IconButton>
          </InputAdornment>
        ),
      }}
      // mui-rff props.
      fieldProps={{
        defaultValue: autoId,
        initialValue: autoId,
      }}
      name={field}
    />
  );
}
