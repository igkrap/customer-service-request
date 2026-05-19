import React from 'react';
import { Box, IconButton, Paper, Slide, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function InlineEditorPanel({ title, subtitle, onClose, children, actions, sx, width = 560 }) {
  return (
    <Slide direction="left" in appear timeout={260}>
      <Paper
        variant="outlined"
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.drawer + 5,
          width: { xs: '100%', sm: width },
          maxWidth: 'calc(100vw - 72px)',
          p: 0,
          mb: 0,
          borderRadius: 0,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-16px 0 32px rgba(15, 23, 42, 0.16)',
          borderTop: 0,
          borderRight: 0,
          borderBottom: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          ...sx,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            flexShrink: 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {onClose && (
            <IconButton onClick={onClose} aria-label="닫기" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Box sx={{ p: 2, flex: 1, minHeight: 0, overflow: 'auto' }}>
          {children}
        </Box>
        {actions && (
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
            sx={{
              px: 2,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
              flexShrink: 0,
            }}
          >
            {actions}
          </Stack>
        )}
      </Paper>
    </Slide>
  );
}

export default InlineEditorPanel;
