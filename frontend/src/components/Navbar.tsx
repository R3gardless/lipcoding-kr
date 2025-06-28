import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/profile" style={{ textDecoration: 'none', color: '#007bff' }}>
          프로필
        </Link>
        {user.role === 'mentee' && (
          <>
            <Link to="/mentors" style={{ textDecoration: 'none', color: '#007bff' }}>
              멘토 찾기
            </Link>
            <Link to="/requests" style={{ textDecoration: 'none', color: '#007bff' }}>
              내 요청
            </Link>
          </>
        )}
        {user.role === 'mentor' && (
          <Link to="/requests" style={{ textDecoration: 'none', color: '#007bff' }}>
            요청 관리
          </Link>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>안녕하세요, {user.profile.name}님</span>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
