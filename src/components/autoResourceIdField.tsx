import { Icon, IconButton, InputAdornment } from "@mui/material";
import { TextFieldProps } from "mui-rff";
import { ComponentType, useCallback, useState } from "react";
import { useAsync } from "react-async";
import { useField, useForm, useFormState } from "react-final-form";

type RequiredProps = Pick<TextFieldProps, "InputProps" | "fieldProps" | "name">;

export interface AutoResourceIdFieldProps<T> {
  field: string;
  generateId: (name: string) => Promise<string>;
  Component: ComponentType<RequiredProps & T>;
  componentProps: Exclude<T, RequiredProps>;
}

export function AutoResourceIdField<T>({
  field,
  generateId,
  Component,
  componentProps,
}: AutoResourceIdFieldProps<T>) {
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
      {...componentProps}
    />
  );
}
