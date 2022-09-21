import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Icon,
  IconButton,
} from "@mui/material";
import Button from "@mui/material/Button";
import { yellow } from "@mui/material/colors";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";
import { ReactElement } from "react";

export interface NotebookCustomImageAlertDialogState {
  alertDialog: ReactElement;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

interface UseNotebookCustomImageAlertDialogProp {
  formId: string;
}

export default function useNotebookCustomImageAlertDialog({
  formId,
}: UseNotebookCustomImageAlertDialogProp): NotebookCustomImageAlertDialogState {
  const [open, setOpen] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  const handleBoxCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  return {
    alertDialog: (
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setChecked(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          <IconButton
            size="small"
            component="span"
            aria-label="warning"
            style={{ color: yellow[700] }}
          >
            <Icon>warning</Icon>
          </IconButton>
          Create an instance with a custom docker image
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You are about to create a notebook instance using an unverified
            docker image. Please make sure that it was created by you or someone
            you trust. Custom docker images could potentially cause serious
            security issues.
          </DialogContentText>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox onChange={handleBoxCheck} />}
              label="I am confident that my image is safe and understand the risks involved"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              setOpen(false);
              setChecked(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!checked}
            onClick={() => {
              setChecked(false);
              document
                .getElementById(formId)
                ?.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                );
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    ),
    dialogOpen: open,
    setDialogOpen: setOpen,
  };
}
