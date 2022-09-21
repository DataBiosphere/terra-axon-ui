import {
  Box,
  BoxProps,
  CircularProgress,
  Toolbar,
  Typography,
} from "@mui/material";
import { ReactElement } from "react";

export interface LoadingProps extends BoxProps {
  message?: string;
}

export function Loading({ message, ...boxProps }: LoadingProps): ReactElement {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      position="fixed"
      top="0"
      bottom="0"
      left="0"
      right="0"
      margin="auto"
      {...boxProps}
    >
      <Toolbar />
      <CircularProgress sx={{ margin: 2 }} color="primary" />
      <Typography variant="subtitle1">{message}</Typography>
    </Box>
  );
}

export function InlineLoading() {
  return (
    <Box display="flex" width="100%" justifyContent="center" my={3}>
      <CircularProgress color="primary" />
    </Box>
  );
}
