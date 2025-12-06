import React, { useState } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { attachmentAPI } from '../services/api';

const FileUpload = ({ attachments = [], onAttachmentsChange, disabled = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const response = await attachmentAPI.upload(file);
        return response.data;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      onAttachmentsChange([...attachments, ...uploadedFiles]);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('파일 업로드 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await attachmentAPI.download(attachment.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('File download failed:', error);
      alert('파일 다운로드 실패');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadIcon />}
          disabled={disabled || uploading}
        >
          파일 선택
          <input
            type="file"
            hidden
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
        </Button>
        {uploading && <CircularProgress size={24} />}
      </Box>

      {attachments.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            첨부파일 ({attachments.length})
          </Typography>
          <List dense>
            {attachments.map((attachment, index) => (
              <ListItem key={attachment.id || index}>
                <AttachFileIcon sx={{ mr: 1, color: 'action.active' }} />
                <ListItemText
                  primary={attachment.originalFileName}
                  secondary={
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={formatFileSize(attachment.fileSize)}
                        size="small"
                        variant="outlined"
                      />
                      {attachment.uploadedByUsername && (
                        <Typography variant="caption" color="text.secondary">
                          업로드: {attachment.uploadedByUsername}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="download"
                    onClick={() => handleDownload(attachment)}
                    sx={{ mr: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                  {!disabled && (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemove(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
