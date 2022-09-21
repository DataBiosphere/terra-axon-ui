import { Typography } from "@mui/material";
import { ReactElement } from "react";
import { FallbackProps } from "react-error-boundary";
import { errorMessage } from "../components/errorhandler";
import { PageContentCard } from "../components/pageContent";
import { PageTitle } from "../components/pageTitle";

export default function ErrorPage({ error }: FallbackProps): ReactElement {
  return (
    <div>
      <PageTitle title="Error" />
      <PageContentCard>
        <Typography paragraph>
          An error has occurred: <b>{errorMessage(error)}</b>
        </Typography>
      </PageContentCard>
    </div>
  );
}
