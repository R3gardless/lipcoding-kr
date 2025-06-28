import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchRequestAPI, MatchRequest } from '../api/api';
import Navbar from '../components/Navbar';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Cancel, Delete } from '@mui/icons-material';

const Requests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = user.role === 'mentor'
        ? await matchRequestAPI.getIncomingRequests()
        : await matchRequestAPI.getOutgoingRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('요청 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId: number) => {
    try {
      await matchRequestAPI.acceptRequest(requestId);
      await fetchRequests(); // 목록 새로고침
    } catch (error: any) {
      alert(error.response?.data?.message || '요청 수락에 실패했습니다.');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await matchRequestAPI.rejectRequest(requestId);
      await fetchRequests(); // 목록 새로고침
    } catch (error: any) {
      alert(error.response?.data?.message || '요청 거절에 실패했습니다.');
    }
  };

  const handleCancel = async (requestId: number) => {
    try {
      await matchRequestAPI.cancelRequest(requestId);
      await fetchRequests(); // 목록 새로고침
    } catch (error: any) {
      alert(error.response?.data?.message || '요청 취소에 실패했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#ffc107',
      accepted: '#28a745',
      rejected: '#dc3545',
      cancelled: '#6c757d',
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: '대기 중',
      accepted: '수락됨',
      rejected: '거절됨',
      cancelled: '취소됨',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          {user.role === 'mentor' ? '받은 요청 관리' : '보낸 요청 관리'}
        </Typography>
        
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              로딩 중...
            </Typography>
          </Box>
        ) : requests.length === 0 ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1">
              {user.role === 'mentor' ? '받은 요청이 없습니다.' : '보낸 요청이 없습니다.'}
            </Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                userRole={user.role}
                onAccept={handleAccept}
                onReject={handleReject}
                onCancel={handleCancel}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </Box>
        )}
      </Container>
    </>
  );
};

interface RequestCardProps {
  request: MatchRequest;
  userRole: 'mentor' | 'mentee';
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onCancel: (id: number) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  userRole,
  onAccept,
  onReject,
  onCancel,
  getStatusColor,
  getStatusText,
}) => {
  const getStatusSeverity = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {userRole === 'mentor' ? `멘티 ID: ${request.menteeId}` : `멘토 ID: ${request.mentorId}`}
            </Typography>
            <Chip
              label={getStatusText(request.status)}
              color={getStatusSeverity(request.status)}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            요청 ID: {request.id}
          </Typography>
        </Box>

        <Paper
          className="request-message"
          data-mentee={request.menteeId.toString()}
          elevation={1}
          sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            메시지:
          </Typography>
          <Typography variant="body2">
            {request.message}
          </Typography>
        </Paper>

        {userRole === 'mentor' && request.status === 'pending' && (
          <Box display="flex" gap={1}>
            <Button
              id="accept"
              onClick={() => onAccept(request.id)}
              variant="contained"
              color="success"
              fullWidth
              startIcon={<CheckCircle />}
            >
              수락
            </Button>
            <Button
              id="reject"
              onClick={() => onReject(request.id)}
              variant="contained"
              color="error"
              fullWidth
              startIcon={<Cancel />}
            >
              거절
            </Button>
          </Box>
        )}

        {userRole === 'mentee' && request.status === 'pending' && (
          <Button
            onClick={() => onCancel(request.id)}
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<Delete />}
          >
            요청 취소
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default Requests;
