import { Box, Breadcrumbs, Link } from "@mui/material";
import { ReactElement } from "react";
import { Link as RouterLink } from "react-router-dom";
import nop from "./nop";

interface LegalFooterProps {
  handleClose?: () => void;
}

export function LegalFooter({
  handleClose = nop,
}: LegalFooterProps): ReactElement {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#FAFAFA",
      }}
    >
      <Breadcrumbs
        separator="•"
        sx={{
          "& .MuiBreadcrumbs-separator": {
            mt: 0.5,
            fontSize: 18,
          },
        }}
      >
        <Link
          component={RouterLink}
          to="/terms-of-service"
          underline="none"
          sx={{ pb: 0.5, fontSize: "12px", color: "#212121" }}
          target="_blank"
          onClick={handleClose}
        >
          terms of service
        </Link>
        <Link
          component={RouterLink}
          to="/privacy-policy"
          underline="none"
          sx={{ mb: 0.5, fontSize: "12px", color: "#212121" }}
          target="_blank"
          onClick={handleClose}
        >
          privacy policy
        </Link>
      </Breadcrumbs>
    </Box>
  );
}
