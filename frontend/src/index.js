import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import App from './App';
import theme from './theme';

const globalStyles = (
  <GlobalStyles
    styles={{
      body: {
        background: 'radial-gradient(circle at 10% 20%, rgba(91, 103, 255, 0.10), transparent 25%), radial-gradient(circle at 90% 10%, rgba(11, 212, 183, 0.12), transparent 22%), radial-gradient(circle at 50% 80%, rgba(255, 185, 87, 0.15), transparent 24%), #f3f5fb',
        minHeight: '100vh'
      },
      '#root': {
        minHeight: '100vh'
      },
      '.glass-surface': {
        background: 'linear-gradient(140deg, rgba(255,255,255,0.92), rgba(255,255,255,0.88))',
        border: '1px solid rgba(90,103,255,0.10)',
        boxShadow: '0 24px 70px rgba(11, 16, 33, 0.18)',
        backdropFilter: 'blur(14px)'
      }
    }}
  />
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
