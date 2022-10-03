import { Box, Typography } from "@mui/material";
import { ReactElement, ReactNode } from "react";

export interface SectionHeaderProps {
  primary?: string;
  secondary?: string | ReactNode;
  actions?: ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
}

export function SectionHeader({
  primary,
  secondary,
  actions,
  primaryColor = "text.primary",
  secondaryColor = "text.secondary",
}: SectionHeaderProps): ReactElement {
  return (
    <Box display="flex" alignItems="flex-start">
      <Box sx={{ flexGrow: 1, ml: 1, mb: -1 }}>
        {primary && (
          // TODO: Remove sectionHeader variant once theming is worked out
          <Typography variant="sectionHeader" sx={{ color: primaryColor }}>
            {primary}
          </Typography>
        )}
        {secondary && (
          // TODO: Add variant once theming is worked out. I.E. potentially subtitle1
          <Typography sx={{ color: secondaryColor }}>{secondary}</Typography>
        )}
      </Box>
      <Box>{actions}</Box>
    </Box>
  );
}
