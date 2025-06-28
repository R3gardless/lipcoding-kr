import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchRequestAPI, MatchRequest } from '../api/api';
import Navbar from '../components/Navbar';

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
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {user.role === 'mentor' ? '받은 요청 관리' : '보낸 요청 관리'}
        </h2>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
        ) : requests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
            {user.role === 'mentor' ? '받은 요청이 없습니다.' : '보낸 요청이 없습니다.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          </div>
        )}
      </div>
    </div>
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
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>
            {userRole === 'mentor' ? `멘티 ID: ${request.menteeId}` : `멘토 ID: ${request.mentorId}`}
          </h3>
          <div
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              backgroundColor: getStatusColor(request.status),
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 'bold',
            }}
          >
            {getStatusText(request.status)}
          </div>
        </div>
        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
          요청 ID: {request.id}
        </span>
      </div>

      <div
        className="request-message"
        data-mentee={request.menteeId.toString()}
        style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #dee2e6',
        }}
      >
        <strong>메시지:</strong>
        <p style={{ margin: '0.5rem 0 0 0' }}>{request.message}</p>
      </div>

      {userRole === 'mentor' && request.status === 'pending' && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            id="accept"
            onClick={() => onAccept(request.id)}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            수락
          </button>
          <button
            id="reject"
            onClick={() => onReject(request.id)}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            거절
          </button>
        </div>
      )}

      {userRole === 'mentee' && request.status === 'pending' && (
        <button
          onClick={() => onCancel(request.id)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          요청 취소
        </button>
      )}
    </div>
  );
};

export default Requests;
