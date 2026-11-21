import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './auth';
import { showToast } from '../utils/toast';

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
// Обрабатываем ошибки глобально
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isLoginRequest = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isLoginRequest) {
      // 401 на любом запросе КРОМЕ логина = сессия истекла
      showToast('info', 'Сессия истекла. Войдите заново.');
    }
    // На login/register 401 НЕ показываем — там свой текст в компоненте

    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const seconds = retryAfter ? ` через ${retryAfter} сек` : '';
      showToast('warning', `Слишком много попыток${seconds}. Подождите минуту.`);
    }

    if (status === 413) {
      showToast('error', 'Файл слишком большой (макс. 10 МБ).');
    }

    if (!error.response) {
      const isTimeout =
        error.code === 'ECONNABORTED' || 
        /timeout/i.test(error.message || '') ||
        error.message?.includes('90000');
      
      if (isTimeout) {
        showToast('error', 'Сервер слишком долго не отвечает. Попробуйте ещё раз.');
      } else {
        showToast('error', 'Нет подключения к интернету. Проверьте сеть.');
      }
    }

    return Promise.reject(error);
  }
);

// === Функции для работы с транзакциями ===

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
  const response = await api.post('/api/v1/transactions/categories/', {
    name: data.name,
    icon: data.icon || 'cube-outline',
    color: data.color || '#9CA3AF',
  });
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.patch(`/api/v1/transactions/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/api/v1/transactions/categories/${id}`);
  return response.data;
};

export const deleteTransaction = async (transactionId) => {
  const response = await api.delete(`/api/v1/transactions/${transactionId}`);
  return response.data;
};

// === Голосовой ввод: аудио -> /voice ===
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

  const response = await api.post('/api/v1/transactions/voice', formData, {
    timeout: 120000,
  });
  return response.data;
};

// === Функции для авторизации ===

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
  const response = await api.post('/api/v1/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  return response.data;
};

// === AI-инсайты (ИСПРАВЛЕНО: date_from и date_to) ===
export const getInsights = async (dateFrom, dateTo) => {
  const response = await api.get('/api/v1/insights/', {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
    },
    timeout: 60000,
  });
  return response.data;
};

// === Аналитика (ИСПРАВЛЕНО: date_from и date_to) ===
export const getStatsSummary = async (dateFrom, dateTo) => {
  const response = await api.get('/api/v1/stats/summary', {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
    },
    timeout: 30000,
  });
  return response.data;
};

// === ХЕЛПЕРЫ для новых контрактов ===

export const normalizeTransactionResult = (raw) => {
  if (!raw) return { transaction: null, categoryMatch: 'exact', suggestedNewCategory: null };

  if (raw.transaction) {
    // /parse-and-save — обёрнутый ответ
    return {
      transaction: raw.transaction,
      categoryMatch: raw.category_match || 'exact',
      suggestedNewCategory: raw.suggested_new_category || null,
    };
  }

  // /voice — плоский ответ (теперь с category_match)
  return {
    transaction: raw,
    categoryMatch: raw.category_match || 'exact',
    suggestedNewCategory: raw.suggested_new_category || null,
  };
};

export const isFallbackTransaction = (transaction) => {
  return !!transaction?.description?.startsWith('[Сбой');
};