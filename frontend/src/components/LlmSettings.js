import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../services/api';
import PageHeader from './common/PageHeader';
import { EmptyState, PageBody, SectionPanel } from './common/WorkspaceLayout';

const initialConfig = {
  apiEndpoint: '',
  modelName: '',
  embeddingModelName: '',
  embeddingDimension: 1536,
  apiKey: '',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  enabled: true,
};

function LlmSettings() {
  const [configs, setConfigs] = useState([]);
  const [currentConfig, setCurrentConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/llm-configurations');
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch LLM configurations:', error);
      setSnackbar({
        open: true,
        message: 'LLM 설정을 불러오지 못했습니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleChange = (field) => (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    if (['embeddingDimension', 'maxTokens'].includes(field)) {
      value = Number(value);
    }
    if (['temperature', 'topP'].includes(field)) {
      value = parseFloat(value);
    }

    setCurrentConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setCurrentConfig(initialConfig);
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editMode && currentConfig.id) {
        await api.put(`/llm-configurations/${currentConfig.id}`, currentConfig);
        setSnackbar({
          open: true,
          message: 'LLM 설정이 수정되었습니다.',
          severity: 'success',
        });
      } else {
        await api.post('/llm-configurations', currentConfig);
        setSnackbar({
          open: true,
          message: 'LLM 설정이 추가되었습니다.',
          severity: 'success',
        });
      }
      await fetchConfigs();
      handleReset();
    } catch (error) {
      console.error('Failed to save LLM configuration:', error);
      setSnackbar({
        open: true,
        message: 'LLM 설정 저장에 실패했습니다.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (config) => {
    setCurrentConfig({
      ...initialConfig,
      ...config,
      apiKey: config.apiKey || '',
    });
    setEditMode(true);
    setPendingDeleteId(null);
  };

  const handleDelete = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      await api.delete(`/llm-configurations/${id}`);
      setSnackbar({
        open: true,
        message: 'LLM 설정이 삭제되었습니다.',
        severity: 'success',
      });
      setPendingDeleteId(null);
      await fetchConfigs();
    } catch (error) {
      console.error('Failed to delete LLM configuration:', error);
      setSnackbar({
        open: true,
        message: 'LLM 설정 삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="LLM 설정 관리" subtitle="챗봇과 임베딩에 사용할 모델 API 설정을 관리합니다." />
      <PageBody>
        <Alert severity="info">
          OpenAI 호환 API 또는 로컬 LLM API 엔드포인트를 등록합니다. 임베딩은 <code>/embeddings</code>,
          채팅은 <code>/chat/completions</code> 경로를 사용하는 구성을 기준으로 합니다.
        </Alert>

        <SectionPanel
          title={editMode ? 'LLM 설정 수정' : 'LLM 설정 추가'}
          subtitle="운영 환경에서 사용할 채팅 모델과 임베딩 모델 정보를 입력합니다."
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API 엔드포인트"
                value={currentConfig.apiEndpoint}
                onChange={handleChange('apiEndpoint')}
                placeholder="http://localhost:11434/v1"
                helperText="예: http://localhost:11434/v1, https://api.openai.com/v1"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="채팅 모델명"
                value={currentConfig.modelName}
                onChange={handleChange('modelName')}
                placeholder="gpt-4.1-mini, llama3 등"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API 키"
                value={currentConfig.apiKey}
                onChange={handleChange('apiKey')}
                type="password"
                placeholder="필요한 경우 입력"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="임베딩 모델명"
                value={currentConfig.embeddingModelName}
                onChange={handleChange('embeddingModelName')}
                placeholder="text-embedding-3-small, nomic-embed-text 등"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="임베딩 차원"
                type="number"
                value={currentConfig.embeddingDimension}
                onChange={handleChange('embeddingDimension')}
                inputProps={{ min: 384, max: 3072, step: 1 }}
                helperText="예: 768, 1536, 3072"
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Temperature"
                type="number"
                value={currentConfig.temperature}
                onChange={handleChange('temperature')}
                inputProps={{ min: 0, max: 2, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Tokens"
                type="number"
                value={currentConfig.maxTokens}
                onChange={handleChange('maxTokens')}
                inputProps={{ min: 1, max: 32000, step: 100 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Top P"
                type="number"
                value={currentConfig.topP}
                onChange={handleChange('topP')}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={currentConfig.enabled} onChange={handleChange('enabled')} />}
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
                  disabled={saving || !currentConfig.apiEndpoint || !currentConfig.modelName || !currentConfig.embeddingModelName}
                >
                  {editMode ? '수정 저장' : '설정 저장'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </SectionPanel>

        <SectionPanel
          title="저장된 LLM 설정"
          subtitle="등록된 API 설정과 활성 상태를 확인합니다."
          actions={<Chip label={`${configs.length}건`} size="small" color="primary" variant="outlined" />}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : configs.length === 0 ? (
            <EmptyState title="저장된 LLM 설정이 없습니다" description="상단 입력 영역에서 새 설정을 추가하세요." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>API 엔드포인트</TableCell>
                    <TableCell>채팅 모델</TableCell>
                    <TableCell>임베딩 모델</TableCell>
                    <TableCell>차원</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell align="right">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>{config.apiEndpoint}</TableCell>
                      <TableCell>{config.modelName}</TableCell>
                      <TableCell>{config.embeddingModelName}</TableCell>
                      <TableCell>{config.embeddingDimension}</TableCell>
                      <TableCell>
                        <Chip
                          label={config.enabled ? '활성화' : '비활성화'}
                          color={config.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(config)} color="primary">
                          <EditIcon />
                        </IconButton>
                        {pendingDeleteId === config.id ? (
                          <Button size="small" color="error" onClick={() => handleDelete(config.id)}>
                            삭제 확인
                          </Button>
                        ) : (
                          <IconButton size="small" onClick={() => handleDelete(config.id)} color="error">
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

export default LlmSettings;
