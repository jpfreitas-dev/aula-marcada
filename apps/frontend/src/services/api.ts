import axios from 'axios';

import { clearStoredAuth, getStoredToken } from '@/services/auth-service';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      clearStoredAuth();

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);
