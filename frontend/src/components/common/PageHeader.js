import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';

const actionConfig = {
  reset: { label: '초기화', icon: RestartAltIcon, variant: 'outlined', color: 'inherit', order: 10 },
  search: { label: '조회', icon: SearchIcon, variant: 'contained', color: 'primary', order: 20 },
  save: { label: '저장', icon: SaveIcon, variant: 'contained', color: 'primary', order: 30 },
  create: { label: '생성', icon: AddIcon, variant: 'contained', color: 'primary', order: 40 },
  edit: { label: '수정', icon: EditIcon, variant: 'outlined', color: 'inherit', order: 50 },
  delete: { label: '삭제', icon: DeleteIcon, variant: 'outlined', color: 'error', order: 60 },
  export: { label: '내보내기', icon: DownloadIcon, variant: 'outlined', color: 'success', order: 90 },
  send: { label: '전송', icon: SendIcon, variant: 'contained', color: 'primary', order: 90 },
  default: { label: '실행', icon: null, variant: 'outlined', color: 'inherit', order: 90 },
};

export function PageActions({ children, sx }) {
  const orderedChildren = React.Children.toArray(children).sort((left, right) => {
    const leftAction = React.isValidElement(left) ? left.props.action : undefined;
    const rightAction = React.isValidElement(right) ? right.props.action : undefined;
    const leftOrder = actionConfig[leftAction]?.order ?? actionConfig.default.order;
    const rightOrder = actionConfig[rightAction]?.order ?? actionConfig.default.order;
    return leftOrder - rightOrder;
  });

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      justifyContent="flex-end"
      useFlexGap
      flexWrap="wrap"
      sx={{ flexShrink: 0, ...sx }}
    >
      {orderedChildren}
    </Stack>
  );
}

export function PageActionButton({
  action = 'default',
  children,
  icon,
  label,
  variant,
  color,
  sx,
  ...props
}) {
  const config = actionConfig[action] || actionConfig.default;
  const IconComponent = icon === undefined ? config.icon : icon;
  const startIcon = IconComponent === false
    ? undefined
    : React.isValidElement(IconComponent)
      ? IconComponent
      : IconComponent
        ? <IconComponent fontSize="small" />
        : undefined;

  return (
    <Button
      size="small"
      variant={variant || config.variant}
      color={color || config.color}
      startIcon={startIcon}
      sx={{
        minWidth: 'auto',
        height: 34,
        px: 1.25,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        '& .MuiButton-startIcon': {
          mr: 0.5,
          ml: 0,
        },
        ...sx,
      }}
      {...props}
    >
      {children || label || config.label}
    </Button>
  );
}

function PageHeader({ title, subtitle, actions, leading }) {
  const actionArea = React.isValidElement(actions) && actions.type === PageActions
    ? actions
    : actions
      ? <PageActions>{actions}</PageActions>
      : null;

  return (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        minHeight: 68,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
        {leading}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h3"
            className="notion-page-title"
            sx={{
              fontSize: { xs: 19, md: 21 },
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {actionArea}
    </Box>
  );
}

export default PageHeader;
