import {
  Box,
  BoxProps,
  CircularProgress,
  Fade,
  Typography,
} from "@mui/material";
import { ReactElement } from "react";

export interface LoadingProps extends BoxProps {
  message?: string;
  transitionDelay?: string;
}

export function Loading({
  message,
  transitionDelay = "800ms",
  ...boxProps
}: LoadingProps): ReactElement {
  return (
    <Fade in={true} style={{ transitionDelay }}>
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
        <CircularProgress sx={{ margin: 2 }} color="primary" />
        <Typography variant="subtitle1">{message}</Typography>
      </Box>
    </Fade>
  );
}

export function InlineLoading({
  transitionDelay = "800ms",
}: LoadingProps): ReactElement {
  return (
    <Fade in={true} style={{ transitionDelay }}>
      <Box display="flex" width="100%" justifyContent="center" my={3}>
        <CircularProgress color="primary" />
      </Box>
    </Fade>
  );
}
