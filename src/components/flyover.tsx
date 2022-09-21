import {
  Box,
  BoxProps,
  DialogTitle,
  Drawer,
  Icon,
  IconButton,
} from "@mui/material";
import { PopupState } from "material-ui-popup-state/hooks";
import { ReactElement, ReactNode, useState } from "react";

export interface FlyoverStateProps {
  open: boolean;
  onClose: () => void;
}

export type FlyoverProps = FlyoverStateProps & UseFlyoverProps;

export function Flyover({
  open,
  onClose,
  size = "regular",
  title,
  avatar,
  children,
}: FlyoverProps): ReactElement {
  return (
    <Drawer
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: size === "large" ? "1043px" : "666px",
        },
      }}
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Box display="flex">
        <DialogTitle sx={{ flexGrow: 1, pt: 2, pb: 1, px: 3 }}>
          <Box display="flex" alignItems="center">
            {avatar}
            {title}
          </Box>
        </DialogTitle>
        <IconButton onClick={onClose} sx={{ alignSelf: "flex-start" }}>
          <Icon>close</Icon>
        </IconButton>
      </Box>
      {children}
    </Drawer>
  );
}

export interface UseFlyoverProps {
  size?: "regular" | "large";
  title?: string;
  avatar?: ReactNode;
  children: ReactNode;
}

export interface FlyoverState {
  flyover: ReactElement;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function useFlyover({
  children,
  ...other
}: UseFlyoverProps): FlyoverState {
  const [open, setOpen] = useState(false);
  return {
    flyover: (
      <Flyover open={open} onClose={() => setOpen(false)} {...other}>
        {children}
      </Flyover>
    ),
    open: open,
    setOpen: setOpen,
  };
}

export const FlyoverContent = (props: BoxProps): ReactElement => (
  <Box sx={{ m: 3, ...props.sx }} {...props} />
);

export const FlyoverActions = (props: BoxProps): ReactElement => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "flex-end",
      gap: 1,
      m: 3,
    }}
    {...props}
  />
);

export function bindFlyover({ isOpen, close }: PopupState): FlyoverStateProps {
  return {
    open: isOpen,
    onClose: close,
  };
}
