import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../services/api';
import PageHeader from './common/PageHeader';
import InlineEditorPanel from './common/InlineEditorPanel';

function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/email-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      setSnackbar({ open: true, message: '템플릿 로드에 실패했습니다.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate({ ...template });
  };

  const handleCloseEdit = () => {
    setCurrentTemplate(null);
  };

  const handleSave = async () => {
    try {
      await api.put(`/email-templates/${currentTemplate.id}`, {
        templateCode: currentTemplate.templateCode,
        templateName: currentTemplate.templateName,
        subject: currentTemplate.subject,
        body: currentTemplate.body,
        description: currentTemplate.description,
        variables: currentTemplate.variables,
        enabled: currentTemplate.enabled
      });
      setSnackbar({ open: true, message: '템플릿이 성공적으로 저장되었습니다.', severity: 'success' });
      handleCloseEdit();
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      setSnackbar({ open: true, message: '템플릿 저장에 실패했습니다.', severity: 'error' });
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setCurrentTemplate({ ...currentTemplate, [field]: value });
  };

  const handleBodyChange = (value) => {
    setCurrentTemplate({ ...currentTemplate, body: value });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
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
      <PageHeader title="이메일 템플릿 관리" subtitle="알림 메일 문구와 변수를 관리합니다." />
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>

        <Alert severity="info" sx={{ mb: 0, borderRadius: 0 }}>
          각 이메일 템플릿을 편집할 수 있습니다. 변수는 {'{{'} 와 {'}}'}로 감싸서 사용합니다. (예: {'{{'} username {'}}'})
        </Alert>

        {currentTemplate && (
          <InlineEditorPanel
            title="템플릿 편집"
            subtitle={`${currentTemplate.templateName} 템플릿의 제목, 본문, 변수를 수정합니다.`}
            onClose={handleCloseEdit}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <TextField
                  label="템플릿 이름"
                  value={currentTemplate.templateName}
                  onChange={handleChange('templateName')}
                  fullWidth
                />

                <TextField
                  label="코드"
                  value={currentTemplate.templateCode}
                  disabled
                  fullWidth
                  helperText="템플릿 코드는 변경할 수 없습니다"
                />
              </Box>

              <TextField
                label="제목"
                value={currentTemplate.subject}
                onChange={handleChange('subject')}
                fullWidth
                helperText="변수 사용 가능 (예: {{username}})"
              />

              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  본문 (HTML 에디터)
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={currentTemplate.body}
                  onChange={handleBodyChange}
                  modules={quillModules}
                  style={{ height: '300px', marginBottom: '60px' }}
                />
                <Typography variant="caption" color="text.secondary">
                  변수 사용 가능 (예: {'{{'} username {'}}'})
                </Typography>
              </Box>

              <TextField
                label="설명"
                value={currentTemplate.description || ''}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                label="사용 가능한 변수"
                value={currentTemplate.variables || ''}
                onChange={handleChange('variables')}
                fullWidth
                helperText="쉼표로 구분된 변수 목록"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={currentTemplate.enabled}
                    onChange={handleChange('enabled')}
                    color="primary"
                  />
                }
                label="템플릿 활성화"
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleCloseEdit}>취소</Button>
                <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
                  저장
                </Button>
              </Box>
            </Box>
          </InlineEditorPanel>
        )}

        <TableContainer
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderTop: 0,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>템플릿 이름</TableCell>
                <TableCell>코드</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>사용 변수</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.templateName}</TableCell>
                  <TableCell>
                    <Chip label={template.templateCode} size="small" />
                  </TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {template.variables}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={template.enabled ? '활성' : '비활성'}
                      color={template.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(template)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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

export default EmailTemplates;
