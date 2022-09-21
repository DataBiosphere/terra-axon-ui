import { styled, TableRow, TableRowProps } from "@mui/material";

// MUI may implement this into TableRow one day:
// https://github.com/mui/material-ui/issues/28673

export interface DisablableTableRowProps extends TableRowProps {
  disabled?: boolean;
}

export const DisablableTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<DisablableTableRowProps>(({ disabled, theme }) => ({
  ...(disabled && {
    opacity: theme.palette.action.disabledOpacity,
  }),
}));
