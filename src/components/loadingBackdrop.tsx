import { Backdrop, BackdropProps, CircularProgress } from "@mui/material";
import { ReactElement } from "react";

export const LoadingBackdrop = (props: BackdropProps): ReactElement => (
  <Backdrop
    unmountOnExit
    sx={{ zIndex: (theme) => theme.zIndex.tooltip + 100, ...props.sx }}
    {...props}
  >
    <div>
      <CircularProgress color="primary" data-testid="backdrop-progress" />
    </div>
  </Backdrop>
);
