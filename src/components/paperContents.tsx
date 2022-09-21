import { Box } from "@mui/material";
import { ReactElement, ReactNode } from "react";

export interface PaperContentsProps {
  children: ReactNode;
}

export function PaperContents({ children }: PaperContentsProps): ReactElement {
  return (
    <Box px={3} pb={3}>
      {children}
    </Box>
  );
}
