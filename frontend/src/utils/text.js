/**
 * Делает первую букву первого слова заглавной.
 * 
 * Примеры:
 * - "долг сереже" → "Долг сереже"
 * - "кофе" → "Кофе"
 * - "обед в кафе" → "Обед в кафе"
 * 
 * @param {string} text - исходный текст
 * @returns {string} текст с заглавной первой буквой
 */
export const capitalizeFirst = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const trimmed = text.trim();
  if (trimmed.length === 0) return '';
  
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};