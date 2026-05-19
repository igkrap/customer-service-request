import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

export function PageBody({ children, sx }) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: 0,
        overflow: 'auto',
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export function SectionPanel({ title, subtitle, actions, children, sx, contentSx }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 0,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {(title || subtitle || actions) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: children ? '1px solid' : 0,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography variant="h5" sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              {actions}
            </Stack>
          )}
        </Stack>
      )}
      <Box sx={{ p: children ? 1.5 : 0, ...contentSx }}>{children}</Box>
    </Paper>
  );
}

export function FilterPanel({ children, actions, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 0,
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        useFlexGap
        flexWrap="wrap"
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          useFlexGap
          flexWrap="wrap"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {children}
        </Stack>
        {actions && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: 'flex-end', md: 'flex-start' }}
            sx={{ flexShrink: 0, ml: { md: 'auto' } }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export function DataSurface({ children, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

export function EmptyState({ title, description, actions, sx }) {
  return (
    <Box
      sx={{
        minHeight: 148,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        py: 4,
        ...sx,
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Box>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions}
      </Stack>
    </Box>
  );
}

export function RecordListItem({ leading, primary, secondary, meta, actions, selected, sx }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        minHeight: 58,
        px: 1.5,
        py: 1,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 1,
        bgcolor: selected ? 'primary.light' : 'background.paper',
        ...sx,
      }}
    >
      {leading && <Box sx={{ flexShrink: 0 }}>{leading}</Box>}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
            {secondary}
          </Typography>
        )}
        {meta && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
            {meta}
          </Stack>
        )}
      </Box>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>
  );
}
