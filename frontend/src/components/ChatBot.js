import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

function ChatBot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        role: 'assistant',
        content: '안녕하세요! 저는 고객 서비스 지원 AI 챗봇입니다. 무엇을 도와드릴까요?',
        sources: [],
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatbot/chat`,
        {
          message: inputMessage,
          sessionId: user?.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        err.response?.data?.message ||
          '메시지 전송 중 오류가 발생했습니다. LLM 설정을 확인해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '안녕하세요! 저는 고객 서비스 지원 AI 챗봇입니다. 무엇을 도와드릴까요?',
        sources: [],
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Typography variant="h6">AI 챗봇</Typography>
          </Box>
          <IconButton color="inherit" onClick={handleClearChat} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            bgcolor: 'grey.50',
          }}
        >
          <List>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <ListItemAvatar sx={{ minWidth: 0, mr: message.role === 'user' ? 0 : 2, ml: message.role === 'user' ? 2 : 0 }}>
                  <Avatar
                    sx={{
                      bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    }}
                  >
                    {message.role === 'user' ? <UserIcon /> : <BotIcon />}
                  </Avatar>
                </ListItemAvatar>

                <Box
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.role === 'user' ? 'primary.light' : 'white',
                    boxShadow: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                    }}
                  >
                    {message.content}
                  </Typography>

                  {message.sources && message.sources.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        참고 자료:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {message.sources.map((source, idx) => (
                          <Chip
                            key={idx}
                            label={source}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1, textAlign: message.role === 'user' ? 'right' : 'left' }}
                  >
                    {message.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </ListItem>
            ))}
            {loading && (
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <BotIcon />
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ p: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2, display: 'inline' }}>
                    답변을 생성하고 있습니다...
                  </Typography>
                </Box>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={loading}
              variant="outlined"
              size="small"
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.300',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default ChatBot;
