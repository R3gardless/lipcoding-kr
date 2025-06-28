import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mentorAPI, matchRequestAPI, User } from '../api/api';
import Navbar from '../components/Navbar';

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

  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortBy(e.target.value);
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
    return <div>멘티만 접근 가능한 페이지입니다.</div>;
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>멘토 찾기</h2>
        
        {/* 검색 및 정렬 */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
        }}>
          <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                id="search"
                type="text"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                placeholder="기술 스택으로 검색 (예: React, Python)"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                검색
              </button>
            </div>
          </form>

          <div>
            <span style={{ marginRight: '1rem' }}>정렬:</span>
            <label style={{ marginRight: '1rem' }}>
              <input
                id="name"
                type="radio"
                name="sortBy"
                value="name"
                checked={sortBy === 'name'}
                onChange={handleSortChange}
                style={{ marginRight: '0.5rem' }}
              />
              이름순
            </label>
            <label>
              <input
                id="skill"
                type="radio"
                name="sortBy"
                value="skill"
                checked={sortBy === 'skill'}
                onChange={handleSortChange}
                style={{ marginRight: '0.5rem' }}
              />
              기술 스택순
            </label>
          </div>
        </div>

        {/* 멘토 목록 */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
        ) : mentors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            검색 조건에 맞는 멘토가 없습니다.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
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
          </div>
        )}
      </div>
    </div>
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
    <div
      className="mentor"
      style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img
          src={mentor.profile.imageUrl}
          alt={`${mentor.profile.name} 프로필`}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '0.5rem',
          }}
        />
        <h3 style={{ margin: '0.5rem 0' }}>{mentor.profile.name}</h3>
        <p style={{ color: '#6c757d', margin: '0.5rem 0' }}>{mentor.email}</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: '0.5rem 0' }}>{mentor.profile.bio}</p>
      </div>

      {mentor.profile.skills && mentor.profile.skills.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>기술 스택:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
            {mentor.profile.skills.map((skill, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#e9ecef',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {requestStatus ? (
        <div style={{ textAlign: 'center' }}>
          <div
            id="request-status"
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              backgroundColor: requestStatus.color,
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            상태: {requestStatus.text}
          </div>
          {currentRequest && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6c757d' }}>
              메시지: {currentRequest.message}
            </div>
          )}
        </div>
      ) : canSendRequest ? (
        showRequestForm ? (
          <form onSubmit={handleSendRequest}>
            <textarea
              id="message"
              data-mentor-id={mentor.id}
              data-testid={`message-${mentor.id}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="멘토링 요청 메시지를 입력하세요"
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                id="request"
                type="submit"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                요청 보내기
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowRequestForm(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            멘토링 요청하기
          </button>
        )
      ) : (
        <div style={{ textAlign: 'center', color: '#6c757d' }}>
          다른 요청이 대기 중입니다
        </div>
      )}
    </div>
  );
};

export default Mentors;
