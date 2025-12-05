import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  TextField,
  List,
  ListItem,
  Paper,
  IconButton,
  Collapse,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { serviceRequestAPI, commentAPI } from '../services/api';
import FileUpload from './FileUpload';

const ServiceRequestDetail = ({ open, onClose, requestId, onUpdate }) => {
  const [request, setRequest] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDescription, setFollowUpDescription] = useState('');
  const [followUpAttachments, setFollowUpAttachments] = useState([]);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [expandedFollowUps, setExpandedFollowUps] = useState({});

  useEffect(() => {
    if (open && requestId) {
      loadRequest();
    }
  }, [open, requestId]);

  const loadRequest = async () => {
    try {
      const response = await serviceRequestAPI.getById(requestId);
      setRequest(response.data);
    } catch (error) {
      console.error('Failed to load request:', error);
      alert('서비스 요청 로드 실패');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      alert('댓글 내용을 입력하세요');
      return;
    }

    try {
      const commentData = {
        serviceRequestId: requestId,
        commentText,
        isInternal: false,
        attachments: commentAttachments,
      };

      await commentAPI.create(commentData);

      setCommentText('');
      setCommentAttachments([]);
      loadRequest();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('댓글 추가 실패');
    }
  };

  const handleCreateFollowUp = async () => {
    if (!followUpTitle.trim()) {
      alert('후속 요청 제목을 입력하세요');
      return;
    }

    try {
      const followUpData = {
        title: followUpTitle,
        description: followUpDescription,
        customerId: request.customerId,
        parentId: requestId,
        status: 'OPEN',
        priority: request.priority,
        attachments: followUpAttachments,
      };

      await serviceRequestAPI.create(followUpData);

      setFollowUpTitle('');
      setFollowUpDescription('');
      setFollowUpAttachments([]);
      setShowFollowUpForm(false);
      loadRequest();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to create follow-up:', error);
      alert('후속 요청 생성 실패');
    }
  };

  const toggleFollowUp = (followUpId) => {
    setExpandedFollowUps(prev => ({
      ...prev,
      [followUpId]: !prev[followUpId]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'primary',
      IN_PROGRESS: 'warning',
      RESOLVED: 'success',
      HOLD: 'default',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'default',
      MEDIUM: 'primary',
      HIGH: 'warning',
      URGENT: 'error',
    };
    return colors[priority] || 'default';
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleString('ko-KR');
  };

  if (!request) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{request.title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* 기본 정보 */}
        <Box mb={3}>
          <Box display="flex" gap={1} mb={2}>
            <Chip label={request.status} color={getStatusColor(request.status)} size="small" />
            <Chip label={request.priority} color={getPriorityColor(request.priority)} size="small" />
          </Box>

          <Typography variant="body1" paragraph>
            {request.description}
          </Typography>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">고객</Typography>
              <Typography variant="body2">{request.customerName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">담당 매니저</Typography>
              <Typography variant="body2">{request.managerName || '미할당'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">생성일</Typography>
              <Typography variant="body2">{formatDateTime(request.createdAt)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">마감일</Typography>
              <Typography variant="body2">{request.dueDate || '-'}</Typography>
            </Box>
          </Box>

          {/* 첨부파일 */}
          {request.attachments && request.attachments.length > 0 && (
            <Box mt={2}>
              <FileUpload
                attachments={request.attachments}
                onAttachmentsChange={() => {}}
                disabled={true}
              />
            </Box>
          )}
        </Box>

        <Divider />

        {/* 댓글 섹션 */}
        <Box mt={3} mb={3}>
          <Typography variant="h6" gutterBottom>
            댓글 ({request.comments?.length || 0})
          </Typography>

          {request.comments && request.comments.length > 0 && (
            <List>
              {request.comments.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start">
                  <Paper sx={{ width: '100%', p: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle2">{comment.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(comment.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      {comment.commentText}
                    </Typography>
                    {comment.attachments && comment.attachments.length > 0 && (
                      <FileUpload
                        attachments={comment.attachments}
                        onAttachmentsChange={() => {}}
                        disabled={true}
                      />
                    )}
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}

          {/* 댓글 작성 */}
          <Box mt={2}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Box mt={1}>
              <FileUpload
                attachments={commentAttachments}
                onAttachmentsChange={setCommentAttachments}
              />
            </Box>
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleAddComment}
              >
                댓글 추가
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* 후속 요청 섹션 */}
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              후속 요청 ({request.followUpRequests?.length || 0})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ReplyIcon />}
              onClick={() => setShowFollowUpForm(!showFollowUpForm)}
            >
              후속 요청 생성
            </Button>
          </Box>

          {/* 후속 요청 생성 폼 */}
          <Collapse in={showFollowUpForm}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <TextField
                  fullWidth
                  label="후속 요청 제목"
                  variant="outlined"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="후속 요청 내용"
                  variant="outlined"
                  value={followUpDescription}
                  onChange={(e) => setFollowUpDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <FileUpload
                  attachments={followUpAttachments}
                  onAttachmentsChange={setFollowUpAttachments}
                />
                <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                  <Button onClick={() => setShowFollowUpForm(false)}>
                    취소
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateFollowUp}
                  >
                    생성
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Collapse>

          {/* 후속 요청 목록 */}
          {request.followUpRequests && request.followUpRequests.length > 0 && (
            <List>
              {request.followUpRequests.map((followUp) => (
                <ListItem key={followUp.id} sx={{ px: 0 }}>
                  <Paper sx={{ width: '100%', p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" gap={1} alignItems="center">
                        <Typography variant="subtitle1">{followUp.title}</Typography>
                        <Chip label={followUp.status} color={getStatusColor(followUp.status)} size="small" />
                      </Box>
                      <IconButton onClick={() => toggleFollowUp(followUp.id)}>
                        {expandedFollowUps[followUp.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    <Collapse in={expandedFollowUps[followUp.id]}>
                      <Box mt={2}>
                        <Typography variant="body2" paragraph>
                          {followUp.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          생성일: {formatDateTime(followUp.createdAt)}
                        </Typography>
                      </Box>
                    </Collapse>
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceRequestDetail;
