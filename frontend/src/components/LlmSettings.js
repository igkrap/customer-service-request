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
} from '@mui/material';
import {
  Save as SaveIcon,
  SmartToy as AiIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../services/api';

function LlmSettings() {
  const [configs, setConfigs] = useState([]);
  const [currentConfig, setCurrentConfig] = useState({
    apiEndpoint: '',
    modelName: '',
    embeddingModelName: '',
    embeddingDimension: 1536,
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    enabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/llm-configurations');
      setConfigs(response.data);
    } catch (error) {
      console.error('Failed to fetch LLM configurations:', error);
      setSnackbar({
        open: true,
        message: 'LLM 설정 불러오기 실패',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.type === 'number'
        ? parseFloat(event.target.value)
        : event.target.value;
    setCurrentConfig({ ...currentConfig, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editMode && currentConfig.id) {
        await api.put(`/llm-configurations/${currentConfig.id}`, currentConfig);
        setSnackbar({
          open: true,
          message: 'LLM 설정이 성공적으로 업데이트되었습니다.',
          severity: 'success',
        });
      } else {
        await api.post('/llm-configurations', currentConfig);
        setSnackbar({
          open: true,
          message: 'LLM 설정이 성공적으로 생성되었습니다.',
          severity: 'success',
        });
      }
      fetchConfigs();
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
    setCurrentConfig(config);
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 LLM 설정을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/llm-configurations/${id}`);
      setSnackbar({
        open: true,
        message: 'LLM 설정이 삭제되었습니다.',
        severity: 'success',
      });
      fetchConfigs();
    } catch (error) {
      console.error('Failed to delete LLM configuration:', error);
      setSnackbar({
        open: true,
        message: 'LLM 설정 삭제에 실패했습니다.',
        severity: 'error',
      });
    }
  };

  const handleReset = () => {
    setCurrentConfig({
      apiEndpoint: '',
      modelName: '',
      embeddingModelName: '',
      embeddingDimension: 1536,
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      enabled: true,
    });
    setEditMode(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, minHeight: 72, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          LLM 설정 관리
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

        <Alert severity="info" sx={{ mb: 3 }}>
          로컬 LLM API 또는 OpenAI 호환 API의 엔드포인트와 모델 정보를 설정합니다.
          <br />
          임베딩 API는 <code>/embeddings</code>, 채팅 API는 <code>/chat/completions</code> 경로를 사용합니다.
        </Alert>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          {editMode ? 'LLM 설정 수정' : '새 LLM 설정 추가'}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="API 엔드포인트"
              value={currentConfig.apiEndpoint}
              onChange={handleChange('apiEndpoint')}
              placeholder="http://localhost:11434/v1"
              helperText="예: http://localhost:11434/v1 (Ollama), https://api.openai.com/v1 (OpenAI)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="모델 이름"
              value={currentConfig.modelName}
              onChange={handleChange('modelName')}
              placeholder="llama2, gpt-3.5-turbo 등"
              helperText="사용할 모델의 이름"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="API 키 (선택사항)"
              value={currentConfig.apiKey}
              onChange={handleChange('apiKey')}
              type="password"
              placeholder="API 키가 필요한 경우 입력"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="임베딩 모델 이름"
              value={currentConfig.embeddingModelName}
              onChange={handleChange('embeddingModelName')}
              placeholder="nomic-embed-text, text-embedding-ada-002 등"
              helperText="벡터 임베딩 전용 모델"
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
              helperText="768 (nomic), 1536 (ada-002), 3072 (text-embedding-3-large)"
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
              helperText="0-2 (낮을수록 일관적)"
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
              helperText="최대 생성 토큰 수"
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
              helperText="0-1 (다양성 조절)"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={currentConfig.enabled}
                  onChange={handleChange('enabled')}
                />
              }
              label="활성화"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !currentConfig.apiEndpoint || !currentConfig.modelName || !currentConfig.embeddingModelName}
              >
                {editMode ? '수정' : '저장'}
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
          저장된 LLM 설정
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
                  <TableCell>API 엔드포인트</TableCell>
                  <TableCell>채팅 모델</TableCell>
                  <TableCell>임베딩 모델</TableCell>
                  <TableCell>차원</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="right">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      저장된 LLM 설정이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
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
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(config)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(config.id)}
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
