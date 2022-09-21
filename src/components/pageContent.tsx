import { styled } from "@mui/material/styles";
import { ReactElement, ReactNode } from "react";
import { PageCard } from "./pageCard";

export const PageContent = styled("div")(({ theme }) => ({
  padding: theme.spacing(3),
}));

export function PageContentCard({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <PageContent>
      <PageCard>{children}</PageCard>
    </PageContent>
  );
}
