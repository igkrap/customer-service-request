import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { getProfilePictureUrl, notificationAPI, userAPI } from '../services/api';

const roleLabels = {
  ROLE_ADMIN: '관리자',
  ROLE_MANAGER: '매니저',
  ROLE_CUSTOMER: '유저'
};

function AnnouncementCenter() {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sortedUsers = useMemo(() => (
    [...users].sort((a, b) => (a.username || '').localeCompare(b.username || ''))
  ), [users]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userAPI.getAll();
        setUsers(response.data || []);
        setError(null);
      } catch (err) {
        setError(`사용자 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const allSelected = users.length > 0 && selectedUserIds.size === users.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map((user) => user.userId)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSend = async () => {
    setError(null);
    setSuccess(null);

    if (!message.trim()) {
      setError('공지 메시지를 입력해 주세요.');
      return;
    }
    if (selectedUserIds.size === 0) {
      setError('공지 대상을 선택해 주세요.');
      return;
    }

    setSending(true);
    try {
      const trimmedTitle = title.trim();
      const trimmedMessage = message.trim();
      await Promise.all(
        Array.from(selectedUserIds).map((recipientUserId) => (
          notificationAPI.sendAnnouncement({
            recipientUserId,
            title: trimmedTitle || null,
            message: trimmedMessage
          })
        ))
      );
      setSuccess(`총 ${selectedUserIds.size}명에게 공지 알림을 전송했습니다.`);
      setTitle('');
      setMessage('');
      setSelectedUserIds(new Set());
    } catch (err) {
      setError(`공지 전송에 실패했습니다: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          minHeight: 72,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          공지 알림 전송
        </Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
        }}
      >
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            공지 작성
          </Typography>
          <TextField
            label="공지 제목"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="공지 제목을 입력하세요 (선택)"
          />
          <TextField
            label="공지 메시지"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="공지 메시지를 입력하세요"
            multiline
            minRows={6}
            required
          />
          <Box sx={{ mt: 'auto' }}>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending || loadingUsers}
              fullWidth
            >
              {sending ? '전송 중...' : '공지 알림 전송'}
            </Button>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Paper>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              사용자 선택
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={allSelected} onChange={(event) => handleSelectAll(event.target.checked)} />}
              label="전체 선택"
            />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {loadingUsers ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {sortedUsers.map((user) => {
                const isChecked = selectedUserIds.has(user.userId);
                return (
                  <ListItem
                    key={user.id}
                    secondaryAction={(
                      <Checkbox
                        edge="end"
                        checked={isChecked}
                        onChange={() => toggleUser(user.userId)}
                      />
                    )}
                    sx={{ pr: 6 }}
                  >
                    <ListItemAvatar>
                      <Avatar src={getProfilePictureUrl(user.profilePictureId)}>
                        {(user.username || user.userId || '?').slice(0, 1).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.username || '사용자'} (${user.userId})`}
                      secondary={roleLabels[user.role] || '사용자'}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
          {!loadingUsers && users.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              표시할 사용자가 없습니다.
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default AnnouncementCenter;
