import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', width: '100%' }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            회원가입 완료!
          </Typography>
          <Typography variant="body1">
            로그인 페이지로 이동합니다...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          회원가입
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            id="email"
            name="email"
            type="email"
            label="이메일"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            variant="outlined"
          />

          <TextField
            id="password"
            name="password"
            type="password"
            label="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            variant="outlined"
          />

          <TextField
            id="name"
            name="name"
            type="text"
            label="이름"
            value={formData.name}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            variant="outlined"
          />

          <TextField
            id="role"
            name="role"
            select
            label="역할"
            value={formData.role}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
          >
            <MenuItem value="mentee">멘티</MenuItem>
            <MenuItem value="mentor">멘토</MenuItem>
          </TextField>

          <Button
            id="signup"
            type="submit"
            disabled={isLoading}
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : '회원가입'}
          </Button>
        </Box>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
              로그인
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Signup;
