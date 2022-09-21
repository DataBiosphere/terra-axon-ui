import { Box, Typography } from "@mui/material";
import { ReactElement, ReactNode } from "react";

export interface PaperTitleProps {
  primary?: string;
  secondary?: string;
  actions?: ReactNode;
}

export function PaperTitle({
  primary,
  secondary,
  actions,
}: PaperTitleProps): ReactElement {
  return (
    <Box display="flex" alignItems="flex-start" px={3}>
      <Box flexGrow={1} pt={3}>
        {primary && (
          <Typography variant="h2" flexGrow={1} gutterBottom>
            {primary}
          </Typography>
        )}
        {secondary && (
          <Typography variant="subtitle1" flexGrow={1} gutterBottom>
            {secondary}
          </Typography>
        )}
      </Box>
      <Box sx={{ pt: 2 }}>{actions}</Box>
    </Box>
  );
}
