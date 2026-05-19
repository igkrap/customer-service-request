import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { Search as SearchIcon, Send as SendIcon } from '@mui/icons-material';
import { getProfilePictureUrl, notificationAPI, userAPI } from '../services/api';
import PageHeader from './common/PageHeader';
import { EmptyState, PageBody, RecordListItem, SectionPanel } from './common/WorkspaceLayout';

const roleLabels = {
  ROLE_ADMIN: '관리자',
  ROLE_MANAGER: '매니저',
  ROLE_CUSTOMER: '고객',
};

function AnnouncementCenter() {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sortedUsers = useMemo(() => (
    [...users].sort((a, b) => (a.username || '').localeCompare(b.username || ''))
  ), [users]);

  const visibleUsers = useMemo(() => {
    const query = recipientQuery.trim().toLowerCase();
    if (!query) return sortedUsers;

    return sortedUsers.filter((user) => (
      [user.username, user.userId, user.email, user.companyName, roleLabels[user.role]]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ));
  }, [recipientQuery, sortedUsers]);

  const allVisibleSelected = visibleUsers.length > 0
    && visibleUsers.every((user) => selectedUserIds.has(user.userId));

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userAPI.getAll();
        setUsers(response.data || []);
        setError(null);
      } catch (err) {
        setError(`사용자 목록을 불러오지 못했습니다: ${err.message}`);
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

  const handleSelectVisible = (checked) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      visibleUsers.forEach((user) => {
        if (checked) {
          next.add(user.userId);
        } else {
          next.delete(user.userId);
        }
      });
      return next;
    });
  };

  const handleSend = async () => {
    setError(null);
    setSuccess(null);

    if (!message.trim()) {
      setError('공지 메시지를 입력하세요.');
      return;
    }
    if (selectedUserIds.size === 0) {
      setError('공지 수신자를 선택하세요.');
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
            message: trimmedMessage,
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
      <PageHeader title="공지 알림 전송" subtitle="사용자에게 실시간 공지 알림을 보냅니다." />
      <PageBody
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(360px, 0.9fr) minmax(420px, 1.1fr)' },
          alignItems: 'start',
        }}
      >
        <SectionPanel
          title="공지 작성"
          subtitle="제목은 선택 사항이며, 메시지는 수신자에게 그대로 표시됩니다."
          actions={<Chip label={`${selectedUserIds.size}명 선택`} size="small" color="primary" variant="outlined" />}
          sx={{ minHeight: 420 }}
          contentSx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="공지 제목"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요"
          />
          <TextField
            label="공지 메시지"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="전송할 공지 내용을 입력하세요"
            multiline
            minRows={8}
            required
          />
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={sending || loadingUsers || selectedUserIds.size === 0 || !message.trim()}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
          >
            {sending ? '전송 중...' : '공지 알림 전송'}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </SectionPanel>

        <SectionPanel
          title="수신자 선택"
          subtitle="이름, ID, 이메일, 회사, 역할로 검색할 수 있습니다."
          actions={<Chip label={`${visibleUsers.length}명 표시`} size="small" />}
          sx={{ minHeight: 420 }}
          contentSx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              value={recipientQuery}
              onChange={(event) => setRecipientQuery(event.target.value)}
              placeholder="수신자 검색"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={(
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={!allVisibleSelected && visibleUsers.some((user) => selectedUserIds.has(user.userId))}
                  onChange={(event) => handleSelectVisible(event.target.checked)}
                />
              )}
              label="현재 목록 선택"
              sx={{ flexShrink: 0 }}
            />
          </Stack>

          {loadingUsers ? (
            <Box sx={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : visibleUsers.length === 0 ? (
            <EmptyState title="표시할 수신자가 없습니다" description="검색어를 조정하거나 사용자 목록을 확인하세요." />
          ) : (
            <Stack spacing={1} sx={{ maxHeight: 'calc(100vh - 310px)', minHeight: 240, overflow: 'auto', pr: 0.5 }}>
              {visibleUsers.map((user) => {
                const isChecked = selectedUserIds.has(user.userId);
                return (
                  <RecordListItem
                    key={user.id}
                    selected={isChecked}
                    leading={(
                      <Avatar src={getProfilePictureUrl(user.profilePictureId)} sx={{ width: 36, height: 36 }}>
                        {(user.username || user.userId || '?').slice(0, 1).toUpperCase()}
                      </Avatar>
                    )}
                    primary={`${user.username || '사용자'} (${user.userId})`}
                    secondary={user.email || user.companyName || ''}
                    meta={[
                      <Chip key="role" label={roleLabels[user.role] || '사용자'} size="small" />,
                      user.companyName && <Chip key="company" label={user.companyName} size="small" variant="outlined" />,
                    ].filter(Boolean)}
                    actions={(
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleUser(user.userId)}
                      />
                    )}
                  />
                );
              })}
            </Stack>
          )}
        </SectionPanel>
      </PageBody>
    </Box>
  );
}

export default AnnouncementCenter;
