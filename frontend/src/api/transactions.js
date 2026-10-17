import axios from 'axios';
import { API_BASE_URL } from './config';

// Функция для отправки текста на бэкенд (Задача 8.1)
export const createTransaction = async (text) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/transactions/parse-and-save`, {
    text: text,
  });
  return response.data;
};

// Функция для получения списка транзакций
export const getTransactions = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/transactions`);
  return response.data;
};

/**
 * Получить список категорий
 */
export const getCategories = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/transactions/categories`);
  return response.data;
};

/**
 * Обновить транзакцию (PATCH)
 */
export const updateTransaction = async (id, data) => {
  const response = await axios.patch(`${API_BASE_URL}/api/v1/transactions/${id}`, data);
  return response.data;
};

/**
 * Создать новую категорию
 */
export const createCategory = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/transactions/categories`, data);
  return response.data;
};

/**
 * Удалить транзакцию по ID
 */
export const deleteTransaction = async (transactionId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/v1/transactions/${transactionId}`);
  return response.data;
};