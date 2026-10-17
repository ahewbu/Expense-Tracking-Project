/**
 * Форматирует дату транзакции в читаемый вид.
 * 
 * Примеры:
 * - Сегодня, 12:55
 * - Вчера, 14:30
 * - 12 июня, 09:15
 * 
 * @param {string} dateString - ISO дата (например, "2026-10-17T12:55:00Z")
 * @returns {string} отформатированная строка
 */
export const formatTransactionDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  
  // Сбрасываем время для сравнения только дат
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const transactionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today - transactionDay;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Форматируем время
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // Определяем день
  let dayStr;
  if (diffDays === 0) {
    dayStr = 'Сегодня';
  } else if (diffDays === 1) {
    dayStr = 'Вчера';
  } else {
    // Формат: "12 июня"
    const options = { day: 'numeric', month: 'long' };
    dayStr = date.toLocaleDateString('ru-RU', options);
  }

  return `${dayStr}, ${timeStr}`;
};