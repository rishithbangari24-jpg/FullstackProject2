import axios from 'axios';

// Create Axios instance pointing to proxy path /api
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Required to transport secure cookies (refresh token)
});

// In-memory access token storage (Security best practice)
let _accessToken = '';

export const setAccessToken = (token) => {
  _accessToken = token;
};

export const getAccessToken = () => {
  return _accessToken;
};

// Request interceptor: attach access token dynamically
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers['Authorization'] = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: intercept 401 to silently refresh access token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if response is 401 Unauthorized and we haven't already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Access token expired. Attempting silent token refresh...');
        
        // Call refresh endpoint
        const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        if (response.data && response.data.accessToken) {
          const newAccessToken = response.data.accessToken;
          setAccessToken(newAccessToken);
          
          console.log('✅ Access token renewed successfully.');
          
          // Re-inject token into headers and retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Silent token refresh failed:', refreshError.message);
        
        // Token refresh failed completely, log out user locally
        setAccessToken('');
        
        // Dispatch global event so AuthContext can clean up state and redirect
        window.dispatchEvent(new Event('auth-logout'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
