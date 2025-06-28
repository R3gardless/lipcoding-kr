import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Mentors from './pages/Mentors';
import Requests from './pages/Requests';
import './App.css';

// Material-UI 테마 생성
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/profile" replace /> : <Login />
        } 
      />
      <Route 
        path="/signup" 
        element={
          user ? <Navigate to="/profile" replace /> : <Signup />
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/mentors" 
        element={
          <ProtectedRoute allowedRoles={['mentee']}>
            <Mentors />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/requests" 
        element={
          <ProtectedRoute>
            <Requests />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
