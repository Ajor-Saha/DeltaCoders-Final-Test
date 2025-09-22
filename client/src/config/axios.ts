import axios from 'axios';
import { env } from './env';
import useAuthStore from '../store/store';

export const Axios = axios.create({
  baseURL:
    env.BACKEND_BASE_URL|| 'http://localhost:8000',
    withCredentials: true,
});

// Request interceptor to add auth token
Axios.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});