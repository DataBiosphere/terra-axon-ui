import {
  Button,
  ButtonProps,
  Icon,
  IconButton,
  IconButtonProps,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { errorMessage } from "./errorhandler";

export type CopyToClipboardProps = {
  value: string;
} & (
  | { variant?: "icon"; buttonProps?: Omit<IconButtonProps, "onClick"> }
  | { variant: "text"; buttonProps?: Omit<ButtonProps, "onClick"> }
);

export function CopyToClipboardButton({
  value,
  ...props
}: CopyToClipboardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const onClick = () => {
    navigator.clipboard.writeText(value).then(
      () => enqueueSnackbar("Copied to clipboard", { variant: "success" }),
      (e) =>
        enqueueSnackbar("Failed to copy to clipboard: " + errorMessage(e), {
          variant: "error",
        })
    );
  };

  switch (props.variant) {
    case "text":
      return (
        <Button
          variant="outlined"
          startIcon={<Icon>content_copy</Icon>}
          onClick={onClick}
          {...props.buttonProps}
        >
          Copy
        </Button>
      );
    case "icon":
    default:
      return (
        <IconButton size="small" onClick={onClick} {...props.buttonProps}>
          <Icon>content_copy</Icon>
        </IconButton>
      );
  }
}
