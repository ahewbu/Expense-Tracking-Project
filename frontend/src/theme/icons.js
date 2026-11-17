import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

/**
 * Маппинг категорий на Ionicons + цвет.
 * Ключ — точное название категории из БД.
 */
export const CATEGORY_STYLES = {
  'Продукты':              { icon: 'cart',              color: '#10B981' },
  'Рестораны и кафе':      { icon: 'fast-food',         color: '#F59E0B' },
  'Транспорт':             { icon: 'car',               color: '#3B82F6' },
  'Жильё и ЖКХ':           { icon: 'home',              color: '#8B5CF6' },
  'Связь и интернет':      { icon: 'wifi',              color: '#06B6D4' },
  'Здоровье':              { icon: 'medkit',            color: '#EF4444' },
  'Страхование':           { icon: 'shield-checkmark',  color: '#6366F1' },
  'Развлечения':           { icon: 'game-controller',   color: '#EC4899' },
  'Одежда и обувь':        { icon: 'shirt',             color: '#F97316' },
  'Красота и уход':        { icon: 'sparkles',          color: '#D946EF' },
  'Электроника':           { icon: 'laptop',            color: '#64748B' },
  'Дом и ремонт':          { icon: 'hammer',            color: '#78716C' },
  'Образование':           { icon: 'school',            color: '#2563EB' },
  'Путешествия':           { icon: 'airplane',          color: '#0EA5E9' },
  'Спорт':                 { icon: 'bicycle',           color: '#84CC16' },
  'Подарки':               { icon: 'gift',              color: '#F43F5E' },
  'Дети':                  { icon: 'happy',             color: '#FBBF24' },
  'Питомцы':               { icon: 'paw',               color: '#A78BFA' },
  'Финансы':               { icon: 'card',              color: '#14B8A6' },
  'Прочее':                { icon: 'cube-outline', color: '#9CA3AF' },

  // Совместимость со старыми названиями
  'Еда':                   { icon: 'cart',              color: '#10B981' },
  'Жилье':                 { icon: 'home',              color: '#8B5CF6' },
  'Связь':                 { icon: 'wifi',              color: '#06B6D4' },
  'Одежда':                { icon: 'shirt',             color: '#F97316' },
};

const DEFAULT_STYLE = { icon: 'ellipsis-horizontal', color: '#9CA3AF' };

/**
 * Получить имя иконки по названию категории.
 */
export const getCategoryIcon = (categoryName) => {
  if (!categoryName) return DEFAULT_STYLE.icon;
  return CATEGORY_STYLES[categoryName]?.icon || DEFAULT_STYLE.icon;
};

/**
 * Получить цвет категории.
 */
export const getCategoryColor = (categoryName) => {
  if (!categoryName) return DEFAULT_STYLE.color;
  return CATEGORY_STYLES[categoryName]?.color || DEFAULT_STYLE.color;
};

/**
 * Получить полный стиль (иконка + цвет).
 */
export const getCategoryStyle = (categoryName) => {
  if (!categoryName) return DEFAULT_STYLE;
  return CATEGORY_STYLES[categoryName] || DEFAULT_STYLE;
};

/**
 * Компонент иконки категории.
 * Использует цвет из маппинга по умолчанию.
 */
export const CategoryIcon = ({ name, size = 20, color }) => {
  const style = getCategoryStyle(name);
  return (
    <Ionicons
      name={style.icon}
      size={size}
      color={color || style.color}
    />
  );
};

/**
 * Компонент иконки категории с цветным фоном (как в TransactionCard).
 */
export const CategoryIconBadge = ({ name, size = 20 }) => {
  const style = getCategoryStyle(name);
  return (
    <Ionicons
      name={style.icon}
      size={size}
      color={style.color}
    />
  );
};