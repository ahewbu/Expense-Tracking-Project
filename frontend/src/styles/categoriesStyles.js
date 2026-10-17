import { StyleSheet } from 'react-native';

// ============================================
// НАСТРОЙКИ ЦВЕТОВ
// ============================================
const COLORS = {
  background: '#FAFAF9',
  cardBackground: '#FFFFFF',
  primary: '#6366F1',
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  border: '#E7E5E4',
  success: '#10B981',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// ============================================
// НАСТРОЙКИ ОТСТУПОВ
// ============================================
const SPACING = {
  screenPadding: 20,
  screenPaddingTop: 40,
  cardPadding: 16,
  cardBorderRadius: 16,
  cardGap: 12,
  colorBarWidth: 4,
  colorBarRadius: 8,
};

// ============================================
// НАСТРОЙКИ ШРИФТОВ
// ============================================
const FONTS = {
  title: {
    size: 24,
    weight: '700',
  },
  categoryName: {
    size: 16,
    weight: '500',
  },
  empty: {
    size: 14,
  },
};

export const categoriesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.screenPaddingTop,
    paddingHorizontal: SPACING.screenPadding,
  },

  // Заголовок с кнопкой добавления
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: FONTS.title.size,
    fontWeight: FONTS.title.weight,
    color: COLORS.text,
  },

  // Кнопка добавления (+)
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },

  // Список категорий
  listContent: {
    paddingBottom: 20,
  },

  // Карточка категории
  categoryCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.cardPadding,
    borderRadius: SPACING.cardBorderRadius,
    marginBottom: SPACING.cardGap,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Цветная полоска слева
  categoryColorBar: {
    width: SPACING.colorBarWidth,
    height: 40,
    borderRadius: SPACING.colorBarRadius,
    marginRight: 12,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: FONTS.categoryName.size,
    fontWeight: FONTS.categoryName.weight,
    color: COLORS.text,
  },

  categoryIcon: {
    fontSize: 24,
    marginLeft: 8,
  },

  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 40,
    fontSize: FONTS.empty.size,
  },

  // Модальное окно
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { COLORS, SPACING, FONTS };