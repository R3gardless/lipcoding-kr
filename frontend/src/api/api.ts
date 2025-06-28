import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 로그아웃 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 타입 정의
export interface User {
  id: number;
  email: string;
  role: 'mentor' | 'mentee';
  profile: {
    name: string;
    bio: string;
    imageUrl: string;
    skills?: string[];
  };
}

export interface MatchRequest {
  id: number;
  mentorId: number;
  menteeId: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileUpdateRequest {
  id: number;
  name: string;
  role: 'mentor' | 'mentee';
  bio: string;
  image?: string;
  skills?: string[];
}

// API 함수들
export const authAPI = {
  signup: (data: SignupRequest) => api.post('/signup', data),
  login: (data: LoginRequest) => api.post<{ token: string }>('/login', data),
};

export const userAPI = {
  getMe: () => api.get<User>('/me'),
  updateProfile: (data: ProfileUpdateRequest) => api.put<User>('/profile', data),
  getProfileImage: (role: string, id: number) => 
    api.get(`/images/${role}/${id}`, { responseType: 'blob' }),
};

export const mentorAPI = {
  getMentors: (skill?: string, orderBy?: string) => {
    const params = new URLSearchParams();
    if (skill) params.append('skill', skill);
    if (orderBy) params.append('order_by', orderBy);
    return api.get<User[]>(`/mentors?${params.toString()}`);
  },
};

export const matchRequestAPI = {
  createRequest: (data: { mentorId: number; menteeId: number; message: string }) =>
    api.post<MatchRequest>('/match-requests', data),
  getIncomingRequests: () => api.get<MatchRequest[]>('/match-requests/incoming'),
  getOutgoingRequests: () => api.get<MatchRequest[]>('/match-requests/outgoing'),
  acceptRequest: (id: number) => api.put<MatchRequest>(`/match-requests/${id}/accept`),
  rejectRequest: (id: number) => api.put<MatchRequest>(`/match-requests/${id}/reject`),
  cancelRequest: (id: number) => api.delete<MatchRequest>(`/match-requests/${id}`),
};

export default api;
