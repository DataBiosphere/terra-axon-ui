import {
  Breadcrumbs,
  Icon,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  TabsProps,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/system";
import { ReactElement, ReactNode } from "react";
import flattenChildren from "react-flatten-children";
import { Link as RouterLink } from "react-router-dom";

export interface PageTitleProps {
  title?: string;
  backTo?: string;
  backText?: string;
  actions?: ReactNode;
  details?: ReactNode;
  children?: ReactNode;
}

export function PageTitle({
  title,
  backTo,
  backText,
  actions,
  details,
  children,
}: PageTitleProps): ReactElement {
  return (
    <Paper square sx={{ borderLeft: "none" }}>
      <Box sx={{ display: "flex" }}>
        <Stack flexGrow={1}>
          {backTo && (
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
              <Link
                component={RouterLink}
                variant="breadcrumb"
                to={backTo}
                underline="hover"
                sx={{ display: "flex", alignItems: "center" }}
                color="inherit"
              >
                <Icon sx={{ fontSize: 20, minWidth: 44 }}>arrow_back</Icon>
                {backText}
              </Link>
            </Breadcrumbs>
          )}
          <Typography
            variant="h1"
            sx={{ color: "grey.900", ml: "44px", mt: 1.5, mb: 0.5 }}
          >
            {title}
          </Typography>
        </Stack>
        <Box sx={{ display: "flex", gap: 1, mt: 2, ml: 1, mr: 3 }}>
          {actions}
        </Box>
      </Box>
      <Box sx={{ ml: "44px" }}>
        {details && (
          <Breadcrumbs separator="•" sx={{ mb: 0.5 }}>
            {flattenChildren(details)}
          </Breadcrumbs>
        )}
        {children}
      </Box>
    </Paper>
  );
}

export interface PageTitleDetailProps {
  label: ReactNode;
  value: ReactNode;
}

export function PageTitleDetail({ label, value }: PageTitleDetailProps) {
  return (
    <Typography variant="breadcrumb">
      <Box component="span" color="grey.500" fontWeight="700">
        {label}
      </Box>
      &nbsp;
      <Box component="span" color="grey.900" fontWeight="400">
        {value}
      </Box>
    </Typography>
  );
}

export const PageTitleTabs = styled((props: TabsProps) => (
  <Tabs
    {...props}
    TabIndicatorProps={{
      children: <span className="MuiTabs-indicatorSpan" />,
    }}
  />
))(({ theme }) => ({
  "& .MuiTabs-indicator": {
    height: 3,
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  "& .MuiTabs-indicatorSpan": {
    maxWidth: 86,
    width: "100%",
    backgroundColor: theme.palette.primary.main,
    borderRadius: "100px 100px 0px 0px",
  },
}));

export const PageTitleTab = styled(Tab)(({ theme }) => ({
  margin: "0px 20px",
  fontSize: "14px",
  lineHeight: "16px",
  color: theme.palette.grey[600],
  fontWeight: theme.typography.fontWeightBold,
  "&.Mui-selected": {
    color: theme.palette.grey[900],
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
