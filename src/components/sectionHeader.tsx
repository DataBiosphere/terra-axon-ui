import { Box, Typography } from "@mui/material";
import { ReactElement, ReactNode } from "react";

export interface SectionHeaderProps {
  primary?: string;
  actions?: ReactNode;
  color?: string;
}

export function SectionHeader({
  primary,
  actions,
  color = "text.main",
}: SectionHeaderProps): ReactElement {
  return (
    <Box display="flex" alignItems="flex-start">
      <Box flexGrow={1} pt={3}>
        {primary && (
          <Typography
            variant="sectionHeader"
            sx={{ ml: 2, mb: -1, color: color }}
          >
            {primary}
          </Typography>
        )}
      </Box>
      <Box sx={{ pt: 2 }}>{actions}</Box>
    </Box>
  );
}
