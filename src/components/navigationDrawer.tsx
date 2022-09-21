import {
  Box,
  Drawer,
  Icon,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import { ReactElement } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { RegistrationState, useRegistration } from "./registration";

export function NavigationDrawer(): ReactElement {
  const { profile } = useAuth();
  const registration = useRegistration();
  const location = useLocation();

  if (!profile || registration != RegistrationState.Registered) return <></>;

  return (
    <Drawer
      variant="permanent"
      PaperProps={{ sx: { zIndex: (theme) => theme.zIndex.appBar - 1 } }}
      sx={{
        width: 100,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 100,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <List sx={{ py: 0 }}>
        <NavigationItem
          to="/"
          icon="home"
          label="Home"
          selected={location.pathname === "/"}
        />
        <NavigationItem
          to="/workspaces"
          icon="bubble_chart"
          label="Workspaces"
          selected={location.pathname.startsWith("/workspaces")}
        />
        <NavigationItem
          to="/"
          icon="science"
          label="Explore data"
          selected={location.pathname.startsWith("/datasets")}
        />
      </List>
    </Drawer>
  );
}

interface NavigationItemProps {
  to: string;
  icon: string;
  label: string;
  selected: boolean;
}

function NavigationItem({ to, icon, label, selected }: NavigationItemProps) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={RouterLink}
        to={to}
        sx={{
          paddingY: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <ListItemIcon sx={{ minWidth: 0 }}>
          <Icon
            sx={{
              color: selected ? "grey.800" : "grey.600",
              fontSize: 27,
              mt: 0.5,
            }}
          >
            {icon}
          </Icon>
        </ListItemIcon>
        <ListItemText
          disableTypography
          sx={{
            color: selected ? "grey.800" : "grey.600",
            fontSize: "12px",
            lineHeight: "16px",
            fontWeight: "700",
          }}
        >
          {label}
        </ListItemText>
        {selected && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              margin: "auto",
              width: 4,
              height: 52,
              backgroundColor: "primary.main",
              borderTopRightRadius: 9,
              borderBottomRightRadius: 9,
            }}
            data-testid="selected"
          />
        )}
      </ListItemButton>
    </ListItem>
  );
}
