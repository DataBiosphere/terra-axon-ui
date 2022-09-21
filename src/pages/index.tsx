import { Button, Grid, Link, Paper, Stack, Typography } from "@mui/material";
import { ReactElement } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../components/auth";
import { PageContent } from "../components/pageContent";
import { PaperContents } from "../components/paperContents";
import { PaperTitle } from "../components/paperTitle";

export default function IndexPage(): ReactElement {
  return (
    <PageContent>
      <Grid container spacing={3}>
        <Grid item lg={8} xs={12}>
          <Stack spacing={3}>
            <WelcomeCard />
          </Stack>
        </Grid>
        <Grid item lg={4} xs={12}>
          <Stack spacing={3}>
            <NewToTerraCard />
          </Stack>
        </Grid>
      </Grid>
    </PageContent>
  );
}

function WelcomeCard() {
  const { profile, signOut } = useAuth();
  return (
    <Paper variant="outlined">
      <PaperTitle primary="Welcome to Terra" />
      <PaperContents>
        <Typography paragraph>You are signed in as {profile?.name}</Typography>
        <Button color="primary" onClick={signOut}>
          Sign out
        </Button>
        <p>
          <Link component={RouterLink} to="/workspaces">
            Workspaces
          </Link>
        </p>
      </PaperContents>
    </Paper>
  );
}

function NewToTerraCard() {
  return (
    <Paper variant="outlined">
      <PaperTitle primary="New to Terra?" secondary="Terra Support" />
      <PaperContents>
        <Typography>
          Start here to learn more about how to transition your work to the
          cloud on Terra. Also learn how to access, manage and analyze data in
          the cloud.
        </Typography>
      </PaperContents>
    </Paper>
  );
}
