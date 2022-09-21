import { Stack, SxProps, Typography } from "@mui/material";
import { ReactElement, ReactNode } from "react";

export interface EmptyCardProps {
  primary: string;
  secondary: string;
  action?: ReactNode;
  sx?: SxProps;
}

export function EmptyCard({
  primary,
  secondary,
  action,
  sx,
}: EmptyCardProps): ReactElement {
  return (
    <Stack justifyContent="center" alignItems="center" sx={sx}>
      <Typography fontWeight="medium">{primary}</Typography>
      <Typography paragraph={!!action}>{secondary}</Typography>
      {action}
    </Stack>
  );
}
