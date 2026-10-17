/**
 * Сортирует категории так, чтобы "Прочее" всегда было последним.
 * Остальные категории сортируются по алфавиту.
 * 
 * @param {Array} categories - массив объектов категорий [{id, name, icon}, ...]
 * @returns {Array} отсортированный массив
 */
export const sortCategories = (categories) => {
  if (!Array.isArray(categories)) return [];

  // Отделяем "Прочее" от остальных
  const other = categories.filter((cat) => cat.name === 'Прочее');
  const rest = categories.filter((cat) => cat.name !== 'Прочее');

  // Сортируем остальные по алфавиту (по-русски)
  const sorted = rest.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // Возвращаем: сначала отсортированные, в конце — "Прочее"
  return [...sorted, ...other];
};