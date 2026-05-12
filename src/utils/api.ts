import axios from 'axios';
import { useAdminAuthStore } from '@/hooks/adminStore';

// Base URL da API - ajuste conforme necessário
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const BEARER_TOKEN = import.meta.env.VITE_API_HASH;
    if (BEARER_TOKEN) {
      config.headers.Authorization = `Bearer ${BEARER_TOKEN}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAdminAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  }
);
