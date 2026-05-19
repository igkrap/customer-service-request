import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import api from '../services/api';
import PageHeader from './common/PageHeader';
import { EmptyState, PageBody, SectionPanel } from './common/WorkspaceLayout';

const initialDocument = {
  title: '',
  content: '',
  category: '',
  enabled: true,
};

function RagManagement() {
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(initialDocument);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);
  const [documentQuery, setDocumentQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/rag-documents');
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch RAG documents:', error);
      setSnackbar({
        open: true,
        message: 'RAG 문서를 불러오지 못했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const visibleDocuments = useMemo(() => {
    const query = documentQuery.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((document) => (
      [document.title, document.category, document.content]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ));
  }, [documentQuery, documents]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setCurrentDocument((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setCurrentDocument(initialDocument);
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentDocument.title.trim() || !currentDocument.content.trim()) {
      setSnackbar({
        open: true,
        message: '문서 제목과 내용을 입력하세요.',
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
          message: 'RAG 문서가 수정되었습니다. 임베딩이 다시 생성됩니다.',
          severity: 'success',
        });
      } else {
        await api.post('/rag-documents', currentDocument);
        setSnackbar({
          open: true,
          message: 'RAG 문서가 추가되었습니다. 임베딩이 생성됩니다.',
          severity: 'success',
        });
      }
      await fetchDocuments();
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

  const handleEdit = (document) => {
    setCurrentDocument({
      id: document.id,
      title: document.title || '',
      content: document.content || '',
      category: document.category || '',
      enabled: document.enabled,
    });
    setEditMode(true);
    setViewDocument(null);
    setPendingDeleteId(null);
  };

  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      await api.delete(`/rag-documents/${id}`);
      setSnackbar({
        open: true,
        message: 'RAG 문서가 삭제되었습니다.',
        severity: 'success',
      });
      if (viewDocument?.id === id) {
        setViewDocument(null);
      }
      setPendingDeleteId(null);
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to delete RAG document:', error);
      setSnackbar({
        open: true,
        message: 'RAG 문서 삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="RAG 지식베이스 관리" subtitle="챗봇이 참조할 문서와 임베딩 상태를 관리합니다." />
      <PageBody>
        <Alert severity="info">
          챗봇이 참조할 문서를 추가하고 관리합니다. 문서를 저장하면 임베딩이 생성되며, 사용자의 질문과 유사한 문서를 검색해 답변에 활용합니다.
        </Alert>

        {viewDocument && (
          <SectionPanel
            title={viewDocument.title}
            subtitle="문서 상세 내용"
            actions={(
              <Button size="small" variant="outlined" onClick={() => setViewDocument(null)}>
                닫기
              </Button>
            )}
          >
            <Stack spacing={1.5}>
              {viewDocument.category && (
                <Box>
                  <Chip label={viewDocument.category} size="small" color="primary" variant="outlined" />
                </Box>
              )}
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {viewDocument.content}
              </Typography>
            </Stack>
          </SectionPanel>
        )}

        <SectionPanel
          title={editMode ? 'RAG 문서 수정' : 'RAG 문서 추가'}
          subtitle="문서 제목, 분류, 본문을 입력합니다. 비활성 문서는 챗봇 검색에서 제외됩니다."
        >
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
                label="카테고리"
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
                placeholder="챗봇이 참조할 내용을 입력하세요."
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={currentDocument.enabled} onChange={handleChange('enabled')} />}
                label="활성화"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {editMode && (
                  <Button variant="outlined" onClick={handleReset}>
                    취소
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || !currentDocument.title || !currentDocument.content}
                >
                  {editMode ? '수정 저장' : '문서 저장'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </SectionPanel>

        <SectionPanel
          title="저장된 RAG 문서"
          subtitle="등록된 문서의 활성 상태와 내용을 확인합니다."
          actions={<Chip label={`${visibleDocuments.length}/${documents.length}건`} size="small" color="primary" variant="outlined" />}
          contentSx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          <TextField
            value={documentQuery}
            onChange={(event) => setDocumentQuery(event.target.value)}
            placeholder="문서 제목, 카테고리, 내용 검색"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : visibleDocuments.length === 0 ? (
            <EmptyState title="표시할 RAG 문서가 없습니다" description="문서를 추가하거나 검색어를 조정하세요." />
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
                  {visibleDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.title}</TableCell>
                      <TableCell>
                        {document.category ? (
                          <Chip label={document.category} size="small" color="primary" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 420 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {document.content}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={document.enabled ? '활성화' : '비활성화'}
                          color={document.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setViewDocument(document)} color="info">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEdit(document)} color="primary">
                          <EditIcon />
                        </IconButton>
                        {pendingDeleteId === document.id ? (
                          <Button size="small" color="error" onClick={() => handleDelete(document.id)}>
                            삭제 확인
                          </Button>
                        ) : (
                          <IconButton size="small" onClick={() => handleDelete(document.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionPanel>
      </PageBody>

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
