/**
 * Маппинг категорий → иконки Ionicons + спокойная палитра.
 */
export const CATEGORY_ICONS = {
  'Еда': 'fast-food',
  'Транспорт': 'car',
  'Жилье': 'home',
  'Развлечения': 'game-controller',
  'Здоровье': 'heart',
  'Одежда': 'shirt',
  'Связь': 'phone-portrait',
  'Прочее': 'cube',
};

export const CATEGORY_COLORS = {
  'Еда': '#C6B4E9',
  'Транспорт': '#8FA3C2',
  'Жилье': '#A78BFA',
  'Развлечения': '#A3B84A',
  'Здоровье': '#7FB3A3',
  'Одежда': '#E0A9A0',
  'Связь': '#9CA3AF',
  'Прочее': '#C9C6D4',
};

export const getCategoryIcon = (name) => CATEGORY_ICONS[name] || 'cube';
export const getCategoryColor = (name) => CATEGORY_COLORS[name] || '#C9C6D4';