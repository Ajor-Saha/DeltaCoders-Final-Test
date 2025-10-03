import axios from 'axios';
import useAuthStore from '../store/store';
import { env } from './env';

export const Axios = axios.create({
  baseURL: env.BACKEND_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
Axios.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Response interceptor to handle auth errors
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout and redirect
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);
