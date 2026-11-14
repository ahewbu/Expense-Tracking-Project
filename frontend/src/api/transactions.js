import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Токен недействителен, требуется повторный вход');
    }
    return Promise.reject(error);
  }
);

export const createTransaction = async (text) => {
  const response = await api.post('/api/v1/transactions/parse-and-save', { text });
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get('/api/v1/transactions/');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/api/v1/transactions/categories/');
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await api.patch(`/api/v1/transactions/${id}`, data);
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/api/v1/transactions/categories/', data);
  return response.data;
};

export const deleteTransaction = async (transactionId) => {
  const response = await api.delete(`/api/v1/transactions/${transactionId}`);
  return response.data;
};

export const sendVoiceTransaction = async (uri) => {
  const formData = new FormData();
  let file;
  if (uri.startsWith('http') || uri.startsWith('blob:')) {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    file = new File([blob], 'voice.m4a', { type: 'audio/m4a' });
  } else {
    file = { uri, name: 'voice.m4a', type: 'audio/m4a' };
  }
  formData.append('file', file);
  const response = await api.post('/api/v1/transactions/voice', formData, { timeout: 90000 });
  return response.data;
};

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  const response = await api.post('/api/v1/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const register = async (email, password, fullName) => {
  const response = await api.post('/api/v1/auth/register', { email, password, full_name: fullName });
  return response.data;
};

// === ИСПРАВЛЕНО: параметры date_from и date_to под бэкенд ===
export const getInsights = async (startDate, endDate) => {
  const response = await api.get('/api/v1/insights/', {
    params: {
      date_from: startDate,
      date_to: endDate,
    },
    timeout: 60000,
  });
  return response.data;
};

export const getStatsSummary = async (startDate, endDate) => {
  const response = await api.get('/api/v1/stats/summary', {
    params: { start_date: startDate, end_date: endDate },
    timeout: 30000,
  });
  return response.data;
};