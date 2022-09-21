import {
  AppBar,
  Box,
  CssBaseline,
  Link,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { SnackbarProvider } from "notistack";
import { ReactElement } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  Link as RouterLink,
  Redirect,
  Route,
  Switch,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./components/auth";
import { JobsProvider } from "./components/jobs";
import { Loading } from "./components/loading";
import { NavigationDrawer } from "./components/navigationDrawer";
import { PageContentCard } from "./components/pageContent";
import { ProfileButton } from "./components/profileButton";
import { RegistrationState, useRegistration } from "./components/registration";
import configuration from "./configuration";
import ErrorPage from "./pages/error";
import IndexPage from "./pages/index";
import LoginPage from "./pages/login";
import NotFoundPage from "./pages/notFound";
import PrivacyPolicyPage from "./pages/privacyPolicy";
import TermsOfServicePage from "./pages/termsOfService";
import WorkspacePage from "./pages/workspace";
import WorkspacesPage from "./pages/workspaces";
import theme from "./theme";

export default function App(): ReactElement {
  const location = useLocation();
  const { profile } = useAuth();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <JobsProvider>
          <Box display="flex">
            <AppBar
              position="fixed"
              color="inherit"
              variant="outlined"
              elevation={0}
            >
              <Toolbar disableGutters sx={{ px: 2, gap: 2 }}>
                <RouterLink to="/">
                  <img style={{ display: "block" }} src="/logo.svg" />
                </RouterLink>
                <Stack sx={{}}>
                  <Link
                    noWrap
                    component={RouterLink}
                    variant="appBarTitle"
                    to="/"
                    underline="none"
                    sx={{ color: "appBar.title" }}
                  >
                    Terra
                  </Link>
                  {configuration.subtitleBranding && (
                    <Typography
                      variant="appBarSubtitle"
                      sx={{ color: "appBar.subtitle" }}
                    >
                      {configuration.subtitleBranding}
                    </Typography>
                  )}
                </Stack>
                <Box flexGrow={1} />
                <ProfileButton />
              </Toolbar>
            </AppBar>
            <NavigationDrawer />
            <Box component="main" width="100%">
              <Toolbar />
              <ErrorBoundary
                FallbackComponent={ErrorPage}
                resetKeys={[location.pathname, profile]}
              >
                <Switch>
                  <Route exact path="/login">
                    <LoginPage />
                  </Route>
                  <Route exact path="/privacy-policy">
                    <PrivacyPolicyPage />
                  </Route>
                  <Route exact path="/terms-of-service">
                    <TermsOfServicePage />
                  </Route>
                  <Route>
                    <PrivateRoutes />
                  </Route>
                </Switch>
              </ErrorBoundary>
            </Box>
          </Box>
        </JobsProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function PrivateRoutes(): ReactElement {
  const { profile, expired, loaded, signIn } = useAuth();
  const registration = useRegistration();
  const location = useLocation();

  if (!profile) {
    return (
      <Redirect
        to={{ pathname: "/login", state: { from: location.pathname } }}
      />
    );
  }
  if (expired) {
    if (loaded) {
      return (
        <PageContentCard>
          Your Google login has expired.&nbsp;&nbsp;
          <Link component="button" variant="body1" onClick={signIn}>
            Sign in again
          </Link>
        </PageContentCard>
      );
    }
    return <Loading message="Refreshing Authorization..." />;
  }
  if (registration === RegistrationState.Checking) {
    return <Loading message="Checking registration..." />;
  } else if (registration === RegistrationState.Unregistered) {
    return (
      <PageContentCard>
        <Typography>The account {profile?.email} is not registered.</Typography>
        {configuration.supportEmail && (
          <Typography>
            Please contact{" "}
            <Link href={"mailto:" + configuration.supportEmail}>
              {configuration.supportEmail}
            </Link>{" "}
            to gain access.
          </Typography>
        )}
      </PageContentCard>
    );
  }
  return (
    <Switch>
      <Route exact path="/">
        <IndexPage />
      </Route>
      <Route exact path="/workspaces">
        <WorkspacesPage />
      </Route>
      <Route exact path="/workspaces/:workspaceUserFacingId">
        <WorkspacePage />
      </Route>
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
}
