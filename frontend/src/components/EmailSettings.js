import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import api from '../services/api';
import PageHeader, { PageActionButton, PageActions } from './common/PageHeader';
import InlineEditorPanel from './common/InlineEditorPanel';

function EmailSettings() {
  const [settings, setSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    useTls: true,
    useSsl: false,
    enabled: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/email-settings/active');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch email settings:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        await api.put(`/email-settings/${settings.id}`, settings);
        setSnackbar({ open: true, message: '이메일 설정이 성공적으로 업데이트되었습니다.', severity: 'success' });
      } else {
        const response = await api.post('/email-settings', settings);
        setSettings(response.data);
        setSnackbar({ open: true, message: '이메일 설정이 성공적으로 생성되었습니다.', severity: 'success' });
      }
    } catch (error) {
      console.error('Failed to save email settings:', error);
      setSnackbar({ open: true, message: '이메일 설정 저장에 실패했습니다.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const response = await api.post('/email-settings/test', { toEmail: testEmail });
      setSnackbar({
        open: true,
        message: `테스트 이메일이 ${testEmail}로 전송되었습니다. 받은편지함과 스팸 폴더를 확인하세요.`,
        severity: 'success'
      });
      setShowTestEmail(false);
      setTestEmail('');
    } catch (error) {
      console.error('Failed to send test email:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || '알 수 없는 오류';
      setSnackbar({
        open: true,
        message: `테스트 이메일 전송 실패: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="이메일 서버 설정"
        subtitle="SMTP 서버 연결과 테스트 발송을 관리합니다."
        actions={
          <PageActions>
            <PageActionButton
              action="save"
              onClick={handleSave}
              disabled={saving}
              icon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {saving ? '저장 중' : '저장'}
            </PageActionButton>
            <PageActionButton
              action="send"
              variant="outlined"
              onClick={() => setShowTestEmail(true)}
              disabled={!settings.id}
            />
          </PageActions>
        }
      />
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>

        <Alert severity="info" sx={{ mb: 0, borderRadius: 0 }}>
          이메일 알림 기능을 사용하려면 SMTP 서버 정보를 입력하세요. Gmail을 사용하는 경우, 앱 비밀번호를 생성하여 사용해야 합니다.
        </Alert>

        <Grid
          container
          rowSpacing={1.5}
          columnSpacing={1.5}
          sx={{
            m: 0,
            width: '100%',
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderTop: 0,
            bgcolor: 'background.paper',
          }}
        >
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP 호스트"
              value={settings.smtpHost}
              onChange={handleChange('smtpHost')}
              placeholder="smtp.gmail.com"
              helperText="예: smtp.gmail.com, smtp.naver.com"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="SMTP 포트"
              value={settings.smtpPort}
              onChange={handleChange('smtpPort')}
              helperText="일반적으로 587 (TLS) 또는 465 (SSL)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="SMTP 사용자명"
              value={settings.smtpUsername}
              onChange={handleChange('smtpUsername')}
              placeholder="your-email@gmail.com"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="password"
              label="SMTP 비밀번호"
              value={settings.smtpPassword}
              onChange={handleChange('smtpPassword')}
              placeholder="앱 비밀번호"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="발신자 이메일"
              value={settings.fromEmail}
              onChange={handleChange('fromEmail')}
              placeholder="noreply@yourcompany.com"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="발신자 이름"
              value={settings.fromName}
              onChange={handleChange('fromName')}
              placeholder="Customer Service System"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.useTls}
                  onChange={handleChange('useTls')}
                  color="primary"
                />
              }
              label="TLS 사용"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.useSsl}
                  onChange={handleChange('useSsl')}
                  color="primary"
                />
              }
              label="SSL 사용"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={handleChange('enabled')}
                  color="primary"
                />
              }
              label="이메일 알림 활성화"
            />
          </Grid>

        </Grid>

        {showTestEmail && (
          <InlineEditorPanel
            title="테스트 이메일 전송"
            subtitle="현재 저장된 SMTP 설정으로 테스트 메일을 보냅니다."
            onClose={() => setShowTestEmail(false)}
            sx={{ mt: 0 }}
          >
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                label="수신자 이메일 주소"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                sx={{ minWidth: 280, flex: '1 1 320px' }}
              />
              <Button
                onClick={handleSendTestEmail}
                variant="contained"
                disabled={!testEmail || sendingTest}
                startIcon={sendingTest ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ mt: { xs: 0, sm: 0.5 } }}
              >
                {sendingTest ? '전송 중...' : '전송'}
              </Button>
            </Box>
          </InlineEditorPanel>
        )}

        <Box
          sx={{
            mt: 0,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderTop: 0,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" gutterBottom>
            이메일 알림이 발송되는 경우
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ul>
              <li>서비스 요청 생성 시 → 배정된 매니저에게 알림</li>
              <li>서비스 요청 상태 변경 시 → 고객에게 알림</li>
              <li>서비스 요청 해결 완료 시 → 고객에게 알림</li>
              <li>매니저 배정/변경 시 → 새 매니저에게 알림</li>
              <li>사용자 가입 승인/거부 시 → 사용자에게 알림</li>
              <li>프로젝트 요청 승인/거부 시 → 요청자에게 알림</li>
            </ul>
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EmailSettings;
