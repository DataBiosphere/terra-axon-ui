import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    appBarTitle: React.CSSProperties;
    appBarSubtitle: React.CSSProperties;
    breadcrumb: React.CSSProperties;
    progressBar: React.CSSProperties;
    sectionHeader: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    appBarTitle?: React.CSSProperties;
    appBarSubtitle?: React.CSSProperties;
    breadcrumb?: React.CSSProperties;
    progressBar?: React.CSSProperties;
    sectionHeader?: React.CSSProperties;
  }

  interface Palette {
    appBar: AppBarOptions;
    table: TableOptions;
  }

  interface PaletteOptions {
    appBar: AppBarOptions;
    table: TableOptions;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    appBarTitle: true;
    appBarSubtitle: true;
    breadcrumb: true;
    progressBar: true;
    sectionHeader: true;
  }
}

interface AppBarOptions {
  title: string;
  subtitle: string;
}

interface TableOptions {
  primary: string;
  secondary: string;
  selected: string;
  head: string;
}

export const theme = createTheme({
  typography: {
    fontFamily: "Roboto, sans-serif",
    fontSize: 13,
    h1: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontWeight: 500,
      fontSize: 24,
      lineHeight: "32px",
    },
    h2: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontWeight: 700,
      fontSize: 15,
      lineHeight: "20px",
    },
    body2: {
      // 'body2' is used in tables.
      fontSize: 13,
      lineHeight: "20px",
    },
    overline: {
      fontSize: 11,
      lineHeight: "20px",
    },
    button: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontSize: 14,
      lineHeight: "16px",
      letterSpacing: "0.15px",
      textTransform: "none",
    },
    appBarTitle: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontSize: 22,
      lineHeight: "25.78px",
    },
    appBarSubtitle: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontSize: 11,
      lineHeight: "12.89px",
    },
    breadcrumb: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontWeight: 500,
      fontSize: 14,
      lineHeight: "16px",
    },
    progressBar: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontSize: 20,
      lineHeight: "24px",
    },
    sectionHeader: {
      fontFamily: "'Gothic+A1', sans-serif",
      fontSize: 20,
      lineHeight: "24px",
    },
  },
  palette: {
    primary: {
      main: "#0D904F",
    },
    background: {
      default: "#EFF2EF",
    },
    text: {
      primary: "#474747",
      secondary: "#757575",
    },
    action: {
      selected: "#34A853",
      selectedOpacity: 0.2,
    },
    appBar: {
      title: "#5F6368",
      subtitle: "#ABABAB",
    },
    table: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.54)",
      head: "#F8F9FA",
      selected: "#F4FAF7",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiTextField: {
      defaultProps: {
        // Ensures page layout doesn't change on field validation error.
        helperText: " ",
      },
    },
  },
});

export default theme;
