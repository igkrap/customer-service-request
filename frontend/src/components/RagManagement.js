import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function RagManagement() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState({
    title: '',
    content: '',
    category: '',
    enabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rag-documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch RAG documents:', error);
      setSnackbar({
        open: true,
        message: 'RAG 문서 불러오기 실패',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setCurrentDocument({ ...currentDocument, [field]: value });
  };

  const handleSave = async () => {
    if (!currentDocument.title || !currentDocument.content) {
      setSnackbar({
        open: true,
        message: '제목과 내용은 필수 항목입니다.',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (editMode && currentDocument.id) {
        await api.put(`/rag-documents/${currentDocument.id}`, currentDocument);
        setSnackbar({
          open: true,
          message: 'RAG 문서가 성공적으로 업데이트되었습니다. 임베딩이 재생성됩니다.',
          severity: 'success',
        });
      } else {
        await api.post('/rag-documents', currentDocument);
        setSnackbar({
          open: true,
          message: 'RAG 문서가 성공적으로 생성되었습니다. 임베딩이 생성됩니다.',
          severity: 'success',
        });
      }
      fetchDocuments();
      handleReset();
    } catch (error) {
      console.error('Failed to save RAG document:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'RAG 문서 저장에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (doc) => {
    setCurrentDocument({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category || '',
      enabled: doc.enabled,
    });
    setEditMode(true);
  };

  const handleView = (doc) => {
    setViewDocument(doc);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 RAG 문서를 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/rag-documents/${id}`);
      setSnackbar({
        open: true,
        message: 'RAG 문서가 삭제되었습니다.',
        severity: 'success',
      });
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete RAG document:', error);
      setSnackbar({
        open: true,
        message: 'RAG 문서 삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleReset = () => {
    setCurrentDocument({
      title: '',
      content: '',
      category: '',
      enabled: true,
    });
    setEditMode(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <StorageIcon sx={{ mr: 1, fontSize: 30, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">RAG 지식베이스 관리</Typography>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

        <Alert severity="info" sx={{ mb: 3 }}>
          챗봇이 참조할 문서를 추가하고 관리합니다. 문서를 저장하면 자동으로 벡터 임베딩이 생성됩니다.
          <br />
          사용자가 질문하면 유사한 문서를 검색하여 답변에 활용합니다.
        </Alert>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          {editMode ? 'RAG 문서 수정' : '새 RAG 문서 추가'}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="문서 제목"
              value={currentDocument.title}
              onChange={handleChange('title')}
              placeholder="예: 서비스 요청 처리 방법"
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="카테고리 (선택사항)"
              value={currentDocument.category}
              onChange={handleChange('category')}
              placeholder="예: FAQ, 매뉴얼, 정책"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="문서 내용"
              value={currentDocument.content}
              onChange={handleChange('content')}
              placeholder="챗봇이 참조할 내용을 입력하세요..."
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={currentDocument.enabled}
                  onChange={handleChange('enabled')}
                />
              }
              label="활성화 (비활성화하면 챗봇이 참조하지 않습니다)"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !currentDocument.title || !currentDocument.content}
              >
                {editMode ? '수정' : '추가'}
              </Button>
              {editMode && (
                <Button variant="outlined" onClick={handleReset}>
                  취소
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          저장된 RAG 문서 ({documents.length}개)
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>제목</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell>내용 미리보기</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="right">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      저장된 RAG 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>
                        {doc.category ? (
                          <Chip label={doc.category} size="small" color="primary" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.content.length > 100
                          ? doc.content.substring(0, 100) + '...'
                          : doc.content}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.enabled ? '활성화' : '비활성화'}
                          color={doc.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleView(doc)}
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(doc)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(doc.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{viewDocument?.title}</DialogTitle>
        <DialogContent>
          {viewDocument?.category && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                카테고리:
              </Typography>
              <Chip
                label={viewDocument.category}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            </Box>
          )}
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {viewDocument?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

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

export default RagManagement;
