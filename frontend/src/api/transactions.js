import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './auth';

// Создаём axios instance с базовыми настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Добавляем токен ко всем запросам
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обрабатываем 401 ошибки
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен невалиден или истёк
      console.warn('Токен недействителен, требуется повторный вход');
      // Здесь можно добавить редирект на логин
    }
    return Promise.reject(error);
  }
);

// === Функции для работы с транзакциями ===

export const createTransaction = async (text) => {
  const response = await api.post('/api/v1/transactions/parse-and-save', {
    text: text,
  });
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

// === Функции для авторизации ===

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await api.post('/api/v1/auth/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const register = async (email, password, fullName) => {
  const response = await api.post('/api/v1/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  return response.data;
};