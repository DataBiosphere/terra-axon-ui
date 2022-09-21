import {
  Box,
  Card,
  CardMedia,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ReactElement, useEffect } from "react";
import GoogleButton from "react-google-button";
import { useHistory } from "react-router-dom";
import loginGraphic from "../assets/login-graphic.png";
import { useAuth } from "../components/auth";
import { ErrorList } from "../components/errorhandler";
import { LegalFooter } from "../components/legalFooter";
import { useTitlePrefix } from "../components/title";
import configuration from "../configuration";

export default function LoginPage(): ReactElement {
  useTitlePrefix("Sign In");
  const { loaded, error, signIn, profile } = useAuth();
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.up("sm"));

  const history = useHistory();
  useEffect(() => {
    if (profile) {
      const state = history.location.state as { from: string };
      history.replace(state?.from || "/");
    }
  });
  return (
    <Card
      variant="elevation"
      elevation={2}
      sx={{
        m: "auto",
        mt: 8,
        width: "90%",
        maxWidth: 1024,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <ErrorList errors={error} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "space-between",
        }}
      >
        <Box p={5}>
          <Typography variant="h1" sx={{ fontSize: 32 }} mb={3}>
            Welcome to Terra
          </Typography>
          <GoogleButton
            type="light"
            disabled={!loaded}
            onClick={signIn}
            style={{ minWidth: "225px", maxWidth: "350px", width: "90%" }}
          />
          <Typography color="text.primary" fontSize={16} mt={2.5}>
            Terra is an integrated platform for precision health research
          </Typography>
          <Box my={2}>
            <Typography
              color="text.primary"
              component="span"
              fontSize={16}
              mr={1}
            >
              New to Terra?
            </Typography>
            <Link
              href={configuration.registrationPage}
              underline="hover"
              target="_blank"
              rel="noreferrer"
            >
              <Typography
                color="primary.main"
                component="span"
                fontSize={16}
                fontWeight={700}
              >
                Join Us
              </Typography>
            </Link>
          </Box>
        </Box>
        <LegalFooter />
      </Box>
      {sm && (
        <CardMedia
          component="img"
          sx={{ width: "50%", maxWidth: 500, height: 350 }}
          image={loginGraphic}
        />
      )}
    </Card>
  );
}
