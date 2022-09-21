import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { ReactElement, useCallback, useState } from "react";
import { WorkspaceDescription } from "../generated/workspacemanager";

export interface DeleteWorkspaceDialogState {
  deleteWorkspaceDialog: ReactElement;
  show: () => void;
}

export interface DeleteWorkspaceDialogProps {
  workspace: WorkspaceDescription;
  run: () => void;
}

export function useDeleteWorkspaceDialog({
  workspace,
  run,
}: DeleteWorkspaceDialogProps): DeleteWorkspaceDialogState {
  const [open, setOpen] = useState(false);

  const handleCloseConfirm = () => {
    setOpen(false);
    run();
  };

  const handleCloseCancel = () => setOpen(false);

  const dialog = (
    <Dialog open={open} onClose={handleCloseCancel}>
      <DialogTitle sx={{ overflowWrap: "break-word" }}>
        Delete workspace&nbsp;
        <b>
          <q>{workspace.displayName}</q>
        </b>
        &nbsp;?
      </DialogTitle>
      <DialogActions sx={{ py: 2, px: 3 }}>
        <Button
          variant="contained"
          sx={{ py: 1, px: 4 }}
          onClick={handleCloseCancel}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          sx={{ py: 1, px: 4 }}
          onClick={handleCloseConfirm}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
  const show = useCallback(() => setOpen(true), [setOpen]);

  return {
    deleteWorkspaceDialog: dialog,
    show: show,
  };
}
