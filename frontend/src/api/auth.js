import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './config';

// Ключ токена в AsyncStorage (должен совпадать с тем, что используется в login.js)
const TOKEN_KEY = 'jwt_token';

// Axios instance для авторизованных запросов
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Добавляем токен ко всем запросам автоматически
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === Сохранить токен ===
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Ошибка сохранения токена:', e);
  }
};

// === Получить токен ===
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('Ошибка получения токена:', e);
    return null;
  }
};

// === Удалить токен (logout) ===
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Ошибка удаления токена:', e);
  }
};

// === Получить данные текущего пользователя ===
export const getMe = async () => {
  const response = await api.get('/api/v1/auth/me');
  return response.data;
};