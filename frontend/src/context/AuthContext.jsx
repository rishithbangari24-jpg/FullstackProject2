import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAccessToken, getAccessToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth status on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to perform a silent refresh to get a new access token
        const res = await api.post('/auth/refresh');
        if (res.data && res.data.accessToken) {
          setAccessToken(res.data.accessToken);
          
          // If token refresh succeeds, fetch current user profile
          const profileRes = await api.get('/auth/me');
          if (profileRes.data && profileRes.data.user) {
            setUser(profileRes.data.user);
          }
        }
      } catch (err) {
        // Silent refresh failed means user is not logged in, ignore error
        console.log('No active session found.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for forced logout event from API interceptor
    const handleForcedLogout = () => {
      setUser(null);
      setAccessToken('');
    };

    window.addEventListener('auth-logout', handleForcedLogout);
    return () => {
      window.removeEventListener('auth-logout', handleForcedLogout);
    };
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data && res.data.accessToken) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/register', { username, email, password });
      
      if (res.data && res.data.accessToken) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      setAccessToken('');
    }
  };

  // Update profile handler
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await api.put('/auth/update', profileData);
      
      if (res.data && res.data.user) {
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: 'Update failed' };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Update failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ProtectedRoute Guard Component
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#030014',
        color: '#f8fafc',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(255,255,255,0.05)',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <h3 className="text-gradient">Verifying Credentials...</h3>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
