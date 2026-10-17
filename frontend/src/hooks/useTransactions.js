import { useState, useEffect } from 'react';
import { getTransactions, getCategories } from '../api/transactions';

/**
 * Кастомный хук для работы с транзакциями и категориями.
 * 
 * Возвращает:
 * - transactions: массив транзакций
 * - categories: массив категорий
 * - loading: флаг загрузки
 * - error: ошибка (если есть)
 * - refresh: функция для принудительного обновления
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем категории и транзакции параллельно
      const [categoriesData, transactionsData] = await Promise.all([
        getCategories(),
        getTransactions(),
      ]);

      setCategories(categoriesData);
      
      // Фильтруем только подтверждённые траты
      const confirmed = transactionsData.filter((t) => t.status === 'confirmed');
      setTransactions(confirmed);
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Вспомогательная функция: получить имя категории по UUID
  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Без категории';
  };

  return {
    transactions,
    categories,
    loading,
    error,
    refresh: loadData,
    getCategoryName,
  };
}