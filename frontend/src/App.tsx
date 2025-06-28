import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Mentors from './pages/Mentors';
import Requests from './pages/Requests';
import './App.css';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        로딩 중...
      </div>
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
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
