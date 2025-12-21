import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5A67FF',
      light: '#E6E8FF',
      dark: '#2831B5',
      contrastText: '#0B1021'
    },
    secondary: {
      main: '#0BD4B7',
      light: '#C6FFF3',
      dark: '#088B7C',
      contrastText: '#04201C'
    },
    background: {
      default: '#f8f9fb',
      paper: 'rgba(255,255,255,0.92)'
    },
    divider: 'rgba(90,103,255,0.12)'
  },
  typography: {
    fontFamily: 'Inter, "Noto Sans KR", "Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    subtitle1: {
      fontWeight: 600
    },
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 14
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(90,103,255,0.14)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.94))',
          boxShadow: '0 20px 60px rgba(11, 16, 33, 0.12)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          border: '1px solid rgba(90,103,255,0.18)',
          boxShadow: '0 30px 80px rgba(11, 16, 33, 0.22)'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 18px'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 12px',
          '&.Mui-selected': {
            boxShadow: '0 10px 30px rgba(90,103,255,0.20)'
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 14px 40px rgba(90,103,255,0.35)'
        }
      }
    }
  }
});

export default theme;
