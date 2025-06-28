import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'mentee' as 'mentor' | 'mentee',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authAPI.signup(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>회원가입 완료!</h2>
          <p>로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>회원가입</h2>
        
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="role" style={{ display: 'block', marginBottom: '0.5rem' }}>
              역할
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              <option value="mentee">멘티</option>
              <option value="mentor">멘토</option>
            </select>
          </div>

          <button
            id="signup"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span>이미 계정이 있으신가요? </span>
          <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
