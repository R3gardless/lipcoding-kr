import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mentorAPI, matchRequestAPI, User } from '../api/api';
import Navbar from '../components/Navbar';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  FormControl,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Search } from '@mui/icons-material';

const Mentors: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [searchSkill, setSearchSkill] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<{ [key: number]: { message: string; status: string } }>({});
  const [pendingRequest, setPendingRequest] = useState<number | null>(null);

  const fetchMentors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await mentorAPI.getMentors(searchSkill || undefined, sortBy === 'id' ? undefined : sortBy);
      setMentors(response.data);
    } catch (error) {
      console.error('멘토 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchSkill, sortBy]);

  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await matchRequestAPI.getOutgoingRequests();
      const requestMap: { [key: number]: { message: string; status: string } } = {};
      let pendingMentorId: number | null = null;
      
      response.data.forEach(request => {
        requestMap[request.mentorId] = {
          message: request.message,
          status: request.status,
        };
        
        if (request.status === 'pending') {
          pendingMentorId = request.mentorId;
        }
      });
      
      setRequests(requestMap);
      setPendingRequest(pendingMentorId);
    } catch (error) {
      console.error('요청 목록 조회 실패:', error);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
    fetchMyRequests();
  }, [fetchMentors, fetchMyRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentors();
  };

  const sendRequest = async (mentorId: number, message: string) => {
    if (!user) return;

    try {
      await matchRequestAPI.createRequest({
        mentorId,
        menteeId: user.id,
        message,
      });
      
      setRequests(prev => ({
        ...prev,
        [mentorId]: { message, status: 'pending' },
      }));
      setPendingRequest(mentorId);
    } catch (error: any) {
      alert(error.response?.data?.message || '요청 전송에 실패했습니다.');
    }
  };

  const getRequestStatus = (mentorId: number) => {
    const request = requests[mentorId];
    if (!request) return null;
    
    const statusText = {
      pending: '대기 중',
      accepted: '수락됨',
      rejected: '거절됨',
      cancelled: '취소됨',
    }[request.status] || request.status;

    const statusColor = {
      pending: '#ffc107',
      accepted: '#28a745',
      rejected: '#dc3545',
      cancelled: '#6c757d',
    }[request.status] || '#6c757d';

    return { text: statusText, color: statusColor };
  };

  if (!user || user.role !== 'mentee') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">멘티만 접근 가능한 페이지입니다.</Alert>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          멘토 찾기
        </Typography>
        
        {/* 검색 및 정렬 */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                id="search"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                placeholder="기술 스택으로 검색 (예: React, Python)"
                variant="outlined"
                size="medium"
                fullWidth
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{ minWidth: 100 }}
              >
                검색
              </Button>
            </Box>
          </Box>

          <Box>
            <Typography variant="body1" component="span" sx={{ mr: 2 }}>
              정렬:
            </Typography>
            <Box component="div" sx={{ display: 'inline-flex', gap: 2 }}>
              <FormControl component="fieldset">
                <Box display="flex" gap={2}>
                  <Button
                    id="name"
                    variant={sortBy === 'name' ? 'contained' : 'outlined'}
                    onClick={() => setSortBy('name')}
                    size="small"
                  >
                    이름순
                  </Button>
                  <Button
                    id="skill"
                    variant={sortBy === 'skill' ? 'contained' : 'outlined'}
                    onClick={() => setSortBy('skill')}
                    size="small"
                  >
                    기술 스택순
                  </Button>
                </Box>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* 멘토 목록 */}
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              로딩 중...
            </Typography>
          </Box>
        ) : mentors.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1">
              검색 조건에 맞는 멘토가 없습니다.
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}>
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onSendRequest={sendRequest}
                requestStatus={getRequestStatus(mentor.id)}
                canSendRequest={!pendingRequest || pendingRequest === mentor.id}
                currentRequest={requests[mentor.id]}
              />
            ))}
          </Box>
        )}
      </Container>
    </>
  );
};

interface MentorCardProps {
  mentor: User;
  onSendRequest: (mentorId: number, message: string) => void;
  requestStatus: { text: string; color: string } | null;
  canSendRequest: boolean;
  currentRequest?: { message: string; status: string };
}

const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  onSendRequest,
  requestStatus,
  canSendRequest,
  currentRequest,
}) => {
  const [message, setMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendRequest(mentor.id, message);
      setMessage('');
      setShowRequestForm(false);
    }
  };

  return (
    <Card className="mentor" elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box textAlign="center" mb={2}>
          <Avatar
            src={mentor.profile.imageUrl}
            alt={`${mentor.profile.name} 프로필`}
            sx={{ width: 80, height: 80, margin: '0 auto', mb: 1 }}
          />
          <Typography variant="h6" component="h3" gutterBottom>
            {mentor.profile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mentor.email}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          {mentor.profile.bio}
        </Typography>

        {mentor.profile.skills && mentor.profile.skills.length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              기술 스택:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {mentor.profile.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {requestStatus ? (
          <Box textAlign="center">
            <Alert
              id="request-status"
              severity={
                requestStatus.text === '수락됨' ? 'success' :
                requestStatus.text === '거절됨' ? 'error' :
                requestStatus.text === '취소됨' ? 'warning' : 'info'
              }
              sx={{ mb: 1 }}
            >
              상태: {requestStatus.text}
            </Alert>
            {currentRequest && (
              <Typography variant="body2" color="text.secondary">
                메시지: {currentRequest.message}
              </Typography>
            )}
          </Box>
        ) : canSendRequest ? (
          showRequestForm ? (
            <Box component="form" onSubmit={handleSendRequest}>
              <TextField
                id="message"
                data-mentor-id={mentor.id}
                data-testid={`message-${mentor.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="멘토링 요청 메시지를 입력하세요"
                required
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  id="request"
                  type="submit"
                  variant="contained"
                  color="success"
                  size="small"
                  fullWidth
                >
                  요청 보내기
                </Button>
                <Button
                  onClick={() => setShowRequestForm(false)}
                  variant="outlined"
                  color="secondary"
                  size="small"
                  fullWidth
                >
                  취소
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              onClick={() => setShowRequestForm(true)}
              variant="contained"
              color="primary"
              fullWidth
            >
              멘토링 요청하기
            </Button>
          )
        ) : (
          <Alert severity="warning">
            다른 요청이 대기 중입니다
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default Mentors;
