import { Typography, TypographyProps } from "@mui/material";

export const NoWrapTypography = ({ sx, ...props }: TypographyProps) => {
  return (
    <Typography
      {...props}
      component="span"
      sx={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...sx,
      }}
    >
      {props.children}
    </Typography>
  );
};
