import { TableCell, TableCellProps } from "@mui/material";

export const NoWrapCell = ({ sx, ...props }: TableCellProps) => (
  <TableCell
    {...props}
    sx={{
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      ...sx,
    }}
  />
);
