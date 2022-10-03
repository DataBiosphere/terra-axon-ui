import { Typography, TypographyProps } from "@mui/material";

export const MultilineTypography = ({
  maxLines,
  sx,
  ...props
}: TypographyProps & { maxLines: number }) => {
  return (
    <Typography
      {...props}
      sx={{
        display: "-webkit-box",
        overflow: "hidden",
        wordWrap: "break-word",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: maxLines,
        ...sx,
      }}
    >
      {props.children}
    </Typography>
  );
};
