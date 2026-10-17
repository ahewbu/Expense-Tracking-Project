import { StyleSheet } from 'react-native';

// ============================================
// НАСТРОЙКИ ЦВЕТОВ (меняй здесь основные цвета)
// ============================================
const COLORS = {
  background: '#FAFAF9',        // Основной фон экрана
  text: '#1C1917',              // Основной цвет текста
  textSecondary: '#57534E',     // Вторичный цвет текста
  textMuted: '#A8A29E',         // Приглушенный текст (подсказки, даты)
  accent: '#F59E0B',            // Акцентный цвет (суммы)
  primary: '#6366F1',           // Основной цвет (спиннер обновления)
};

// ============================================
// НАСТРОЙКИ ОТСТУПОВ (меняй здесь размеры)
// ============================================
const SPACING = {
  screenPadding: 20,            // Отступы по краям экрана
  screenPaddingTop: 40,         // Отступ сверху экрана
  listPaddingBottom: 20,        // Отступ снизу списка
  hintMarginBottom: 16,         // Отступ под подсказкой
  emptyMarginTop: 40,           // Отступ сверху для пустого списка
};

// ============================================
// НАСТРОЙКИ ШРИФТОВ (меняй здесь размеры текста)
// ============================================
const FONTS = {
  title: {
    size: 24,
    weight: '700',
  },
  hint: {
    size: 12,
  },
  empty: {
    size: 14,
  },
};

export const transactionsStyles = StyleSheet.create({
  // Основной контейнер экрана
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.screenPaddingTop,
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 0, // Таб-бар занимает место снизу
  },

  // Заголовок экрана
  title: {
    fontSize: FONTS.title.size,
    fontWeight: FONTS.title.weight,
    color: COLORS.text,
    marginBottom: 8,
  },

  // Подсказка "Долгое нажатие для действий"
  hint: {
    fontSize: FONTS.hint.size,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.hintMarginBottom,
    fontStyle: 'italic',
  },

  // Содержимое списка (отступ снизу)
  listContent: {
    paddingBottom: SPACING.listPaddingBottom,
  },

  // Текст для пустого списка
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: SPACING.emptyMarginTop,
    fontSize: FONTS.empty.size,
  },

    // Эффект нажатия на карточку
  pressable: {
    borderRadius: 16,
    marginBottom: 12,
  },

  pressableActive: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});

// Экспортируем для использования в других файлах
export { COLORS, SPACING, FONTS };