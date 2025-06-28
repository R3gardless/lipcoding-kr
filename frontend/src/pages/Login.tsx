import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/profile');
    } catch (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        py: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          로그인
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            id="email"
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            margin="normal"
            variant="outlined"
            autoComplete="email"
            autoFocus
          />

          <TextField
            id="password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
            variant="outlined"
            autoComplete="current-password"
          />

          <Button
            id="login"
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              position: 'relative',
            }}
          >
            {isLoading && (
              <CircularProgress
                size={20}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  marginLeft: '-10px',
                }}
              />
            )}
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              계정이 없으신가요?{' '}
              <Link
                to="/signup"
                style={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                }}
              >
                회원가입
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
