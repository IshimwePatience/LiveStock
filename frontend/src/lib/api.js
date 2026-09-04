import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/login');
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getUserStats = () => api.get('/users/stats');

// Traccar Endpoints
export const getTraccarLocations = () => api.get('/traccar/locations');
export const getTraccarRoute = (deviceId, from, to) => 
  api.get(`/traccar/route/${deviceId}?from=${from}&to=${to}`);

export default api;
