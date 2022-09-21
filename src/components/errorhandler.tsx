import { Alert } from "@mui/material";
import { useSnackbar } from "notistack";
import { useCallback } from "react";
import { useErrorHandler } from "react-error-boundary";

type ErrorHandler = (error: unknown) => void;

export function usePageErrorHandler(): ErrorHandler {
  return useErrorHandler();
}

export function useSnackbarErrorHandler(): ErrorHandler {
  const { enqueueSnackbar } = useSnackbar();
  return useCallback(
    (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
    [enqueueSnackbar]
  );
}

export function errorMessage(error: unknown) {
  return (error as Error).message ? (error as Error).message : "Unknown error";
}

export interface ErrorListProps {
  errors?: Error | Error[];
}

export function ErrorList({ errors = [] }: ErrorListProps) {
  return (
    <div>
      {(Array.isArray(errors) ? errors : [errors])
        .filter((error): error is Error => !!error)
        .map((error, index) => (
          <Alert key={index} severity="error" sx={{ my: 2 }}>
            {errorMessage(error)}
          </Alert>
        ))}
    </div>
  );
}
