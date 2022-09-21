import { Box, TableCell, TableCellProps } from "@mui/material";

export const ActionsCell = (props: TableCellProps) => (
  <TableCell align="right" {...props} sx={{ pr: 0 }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
      }}
    >
      {props.children}
    </Box>
  </TableCell>
);
