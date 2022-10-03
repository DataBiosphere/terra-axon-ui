import {
  Box,
  Icon,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ReactElement, ReactNode } from "react";

interface DetailsPaneProps {
  title: string;
  tabs: { [key: string]: ReactNode };
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  actions?: ReactNode;
  onClose?: () => void;
}

export function DetailsPane({
  title,
  tabs,
  selectedTab,
  setSelectedTab,
  onClose = () => null,
  actions,
}: DetailsPaneProps) {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: sm ? "600px" : "100%",
        height: "fit-content",
      }}
    >
      <Paper variant="outlined">
        <DetailsPaneHeader title={title} onClose={onClose}>
          {actions && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                ml: 3,
                gap: 2,
              }}
            >
              {actions}
            </Box>
          )}
          <Tabs
            value={selectedTab}
            onChange={(_, value) => setSelectedTab(value)}
          >
            {Object.keys(tabs).map((key) => (
              <Tab key={key} value={key} label={key} />
            ))}
          </Tabs>
        </DetailsPaneHeader>
        <Box sx={{ padding: 2 }}>{tabs[selectedTab]}</Box>
      </Paper>
    </Box>
  );
}

interface DetailsPaneHeaderProps {
  title?: string;
  onClose: () => void;
  children?: ReactNode;
}

function DetailsPaneHeader({
  title,
  onClose,
  children,
}: DetailsPaneHeaderProps): ReactElement {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
        }}
      >
        <Typography variant="h2" sx={{ color: "#212121", fontSize: "16px" }}>
          {title}
        </Typography>
        <IconButton onClick={onClose}>
          <Icon>close</Icon>
        </IconButton>
      </Box>
      <Box>{children}</Box>
    </Box>
  );
}
