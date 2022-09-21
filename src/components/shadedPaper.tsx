import { Paper, PaperProps, styled } from "@mui/material";

const ShadedPaperBase = styled(Paper)<PaperProps>(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
}));

export const ShadedPaper = (props: PaperProps) => (
  <ShadedPaperBase elevation={0} {...props} />
);
