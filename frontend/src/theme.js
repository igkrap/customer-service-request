import { createTheme } from '@mui/material/styles';

export const designTokens = {
  colors: {
    primary: '#1f6feb',
    primaryBright: '#388bfd',
    primaryDeep: '#1f4fbf',
    primarySoft: '#eaf2ff',
    brandNavy: '#202936',
    linkBlue: '#0969da',
    ink: '#172033',
    charcoal: '#202936',
    canvas: '#ffffff',
    cloud: '#eef1f5',
    fog: '#f7f9fc',
    steel: '#637083',
    graphite: '#4a5568',
    muted: '#8a95a6',
    hairline: '#d7dde6',
    hairlineStrong: '#bfc7d3',
    tintYellow: '#fff7d6',
    tintPeach: '#fff0df',
    tintMint: '#e8f7ee',
    tintLavender: '#eaf2ff',
    error: '#c93434',
    success: '#168a4a',
    warning: '#b7791f',
  },
  radius: {
    button: 6,
    panel: 0,
    card: 0,
  },
  shadow: {
    soft: 'rgba(15, 23, 42, 0.03) 0px 1px 2px 0px',
    card: 'rgba(15, 23, 42, 0.06) 0px 2px 8px 0px',
    floating: 'rgba(15, 23, 42, 0.16) 0px 18px 42px -14px',
  },
};

const fontFamily = '"Notion Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.colors.primary,
      light: designTokens.colors.primarySoft,
      dark: designTokens.colors.primaryDeep,
      contrastText: designTokens.colors.canvas,
    },
    secondary: {
      main: designTokens.colors.brandNavy,
      contrastText: designTokens.colors.canvas,
    },
    error: {
      main: designTokens.colors.error,
    },
    success: {
      main: designTokens.colors.success,
    },
    info: {
      main: designTokens.colors.primaryBright,
    },
    warning: {
      main: designTokens.colors.warning,
      contrastText: designTokens.colors.canvas,
    },
    background: {
      default: designTokens.colors.cloud,
      paper: designTokens.colors.canvas,
    },
    text: {
      primary: designTokens.colors.charcoal,
      secondary: designTokens.colors.graphite,
    },
    divider: designTokens.colors.hairline,
  },
  shape: {
    borderRadius: designTokens.radius.panel,
  },
  typography: {
    fontFamily,
    h1: { fontWeight: 600, letterSpacing: 0, lineHeight: 1.15, fontSize: '2.5rem' },
    h2: { fontWeight: 600, letterSpacing: 0, lineHeight: 1.2, fontSize: '2rem' },
    h3: { fontWeight: 600, letterSpacing: 0, lineHeight: 1.25, fontSize: '1.5rem' },
    h4: { fontWeight: 600, letterSpacing: 0, lineHeight: 1.3, fontSize: '1.25rem' },
    h5: { fontWeight: 600, letterSpacing: 0, lineHeight: 1.4, fontSize: '1.125rem' },
    h6: { fontWeight: 600, letterSpacing: 0, lineHeight: 1.4, fontSize: '1rem' },
    body1: { fontSize: '1rem', lineHeight: 1.55, letterSpacing: 0 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: 0 },
    caption: { fontSize: '0.75rem', lineHeight: 1.33, letterSpacing: 0 },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.3,
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          backgroundColor: designTokens.colors.cloud,
          color: designTokens.colors.charcoal,
          fontFamily,
        },
        '*': {
          boxSizing: 'border-box',
        },
        '::selection': {
          backgroundColor: designTokens.colors.primarySoft,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: designTokens.radius.button,
          boxShadow: 'none',
          textTransform: 'none',
          paddingInline: 14,
        },
        containedPrimary: {
          backgroundColor: designTokens.colors.primary,
          '&:active': {
            backgroundColor: designTokens.colors.primaryDeep,
          },
        },
        outlined: {
          borderColor: designTokens.colors.hairlineStrong,
          color: designTokens.colors.charcoal,
          backgroundColor: designTokens.colors.canvas,
          '&:hover': {
            borderColor: designTokens.colors.primary,
            backgroundColor: designTokens.colors.primarySoft,
          },
        },
        text: {
          color: designTokens.colors.primary,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.button,
          color: designTokens.colors.graphite,
          '&:hover': {
            backgroundColor: designTokens.colors.primarySoft,
            color: designTokens.colors.primaryDeep,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.panel,
          boxShadow: designTokens.shadow.soft,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: designTokens.colors.hairline,
          color: designTokens.colors.charcoal,
        },
        elevation1: {
          boxShadow: designTokens.shadow.soft,
        },
        elevation2: {
          boxShadow: designTokens.shadow.soft,
        },
        elevation3: {
          boxShadow: designTokens.shadow.soft,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.card,
          border: `1px solid ${designTokens.colors.hairline}`,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '14px 18px',
          borderBottom: `1px solid ${designTokens.colors.hairline}`,
          backgroundColor: designTokens.colors.fog,
        },
        title: {
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.4,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 18,
          '&:last-child': {
            paddingBottom: 18,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${designTokens.colors.hairline}`,
          backgroundColor: designTokens.colors.canvas,
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          letterSpacing: 0,
          color: designTokens.colors.graphite,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: designTokens.radius.button,
          margin: '2px 8px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
          height: 24,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: designTokens.radius.card,
          boxShadow: designTokens.shadow.floating,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1.3,
          color: designTokens.colors.charcoal,
          borderBottom: `1px solid ${designTokens.colors.hairline}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: 18,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.button,
          backgroundColor: designTokens.colors.canvas,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: designTokens.colors.primary,
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: designTokens.colors.hairlineStrong,
        },
        input: {
          fontSize: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: designTokens.colors.charcoal,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: `1px solid ${designTokens.colors.hairline}`,
          borderRadius: designTokens.radius.button,
          backgroundColor: designTokens.colors.canvas,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: designTokens.colors.hairline,
          padding: '10px 12px',
          fontSize: 14,
        },
        head: {
          backgroundColor: designTokens.colors.fog,
          color: designTokens.colors.charcoal,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: designTokens.colors.fog,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.panel,
          border: `1px solid ${designTokens.colors.hairline}`,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${designTokens.colors.hairline}`,
          borderRadius: designTokens.radius.panel,
          backgroundColor: designTokens.colors.canvas,
          boxShadow: 'none',
          overflow: 'hidden',
          fontSize: 14,
        },
        columnHeaders: {
          backgroundColor: designTokens.colors.fog,
          color: designTokens.colors.charcoal,
          fontWeight: 700,
          borderBottom: `1px solid ${designTokens.colors.hairlineStrong}`,
        },
        columnHeader: {
          backgroundColor: designTokens.colors.fog,
        },
        cell: {
          borderColor: designTokens.colors.hairline,
        },
        row: {
          '&:nth-of-type(even)': {
            backgroundColor: '#fbfcfe',
          },
          '&:hover': {
            backgroundColor: designTokens.colors.fog,
          },
        },
        toolbarContainer: {
          minHeight: 48,
          padding: '8px 12px',
          borderBottom: `1px solid ${designTokens.colors.hairline}`,
          backgroundColor: designTokens.colors.fog,
        },
      },
    },
  },
});

export default theme;
