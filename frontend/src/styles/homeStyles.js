import { StyleSheet } from 'react-native';

// ============================================
// НАСТРОЙКИ ЦВЕТОВ (меняй здесь основные цвета приложения)
// ============================================
const COLORS = {
  background: '#FAFAF9',        // Основной фон экрана
  cardBackground: '#FFFFFF',    // Фон карточек и блоков
  primary: '#6366F1',           // Основной цвет (кнопки, акценты)
  primaryLight: '#EEF2FF',      // Светлый вариант основного цвета
  text: '#1C1917',              // Основной цвет текста
  textSecondary: '#57534E',     // Вторичный цвет текста (подписи)
  textMuted: '#A8A29E',         // Приглушенный текст (даты, метки)
  accent: '#F59E0B',            // Акцентный цвет (суммы, иконки)
  border: '#E7E5E4',            // Цвет границ
  insightGradient: '#F0F9FF',   // Фон блока инсайтов (светло-голубой)
};

// ============================================
// НАСТРОЙКИ ОТСТУПОВ (меняй здесь размеры и отступы)
// ============================================
const SPACING = {
  screenPadding: 20,            // Отступы экрана по краям
  screenPaddingTop: 40,         // Отступ сверху экрана
  sectionGap: 16,               // Расстояние между блоками
  cardPadding: 20,              // Внутренний отступ карточек
  cardBorderRadius: 20,         // Закругление углов карточек
  fabSize: 64,                  // Размер круглой кнопки
  fabBottom: 100,               // Отступ кнопки от низа (над таб-баром)
};

// ============================================
// НАСТРОЙКИ ШРИФТОВ (меняй здесь размеры и стили текста)
// ============================================
const FONTS = {
  greeting: {
    size: 32,                   // Размер приветствия
    weight: '700',              // Жирность (400, 500, 600, 700, 800)
  },
  date: {
    size: 16,                   // Размер даты
    weight: '400',
  },
  sectionTitle: {
    size: 18,                   // Размер заголовков секций
    weight: '600',
  },
  cardTitle: {
    size: 16,                   // Размер названия траты
    weight: '500',
  },
  cardAmount: {
    size: 16,                   // Размер суммы
    weight: '600',
  },
  insightText: {
    size: 14,                   // Размер текста инсайта
    weight: '400',
  },
};

export const homeStyles = StyleSheet.create({
  // Основной контейнер экрана
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.screenPaddingTop,
    paddingHorizontal: SPACING.screenPadding,
  },

  // Блок приветствия
  greeting: {
    fontSize: 24,
    fontWeight: FONTS.greeting.weight,
    color: COLORS.text,
    marginBottom: 4,
  },

  // Блок с датой
  dateText: {
    fontSize: 14,
    fontWeight: FONTS.date.weight,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },

  // Блок инсайтов от ИИ
  insightCard: {
    backgroundColor: COLORS.insightGradient,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },

  insightTitle: {
    fontSize: 16,
    fontWeight: FONTS.sectionTitle.weight,
    color: COLORS.primary,
    marginBottom: 6,
  },

  insightText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 28,
  },

  // Блок последних трат
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Тень для объема (работает на iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Тень для Android
    elevation: 3,
  },

  // Заголовок секции со стрелочкой
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: FONTS.sectionTitle.size,
    fontWeight: FONTS.sectionTitle.weight,
    color: COLORS.text,
  },

  arrowButton: {
    padding: 4,
  },

  arrowText: {
    fontSize: 20,
    color: COLORS.primary,
  },

  // Карточка траты внутри блока
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // <-- Было 'center', меняем на 'flex-start'
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  transactionInfo: {
    flex: 1,
    marginLeft: 4,
  },

  transactionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    marginTop: 6.5, // <-- Добавляем отступ сверху, чтобы кружок был на уровне текста
  },

  transactionName: {
    fontSize: FONTS.cardTitle.size,
    fontWeight: FONTS.cardTitle.weight,
    color: COLORS.text,
    marginBottom: 4,
  },

  transactionCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  transactionAmount: {
    fontSize: FONTS.cardAmount.size,
    fontWeight: FONTS.cardAmount.weight,
    color: COLORS.accent,
  },

  // Круглая кнопка добавления (FAB)
  // Круглая кнопка добавления (FAB) - теперь по центру
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 16, // <-- Центрируем по горизонтали
    marginTop: 20,       // <-- Отступ сверху от блока трат
    marginBottom: 20,    // <-- Отступ снизу до таб-бара
    // Тень
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },

  // Пустой список
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    paddingVertical: 20,
  },

    // Прокручиваемая область контента (над таб-баром)
  scrollContent: {
    flex: 1,
  },

  scrollContentInner: {
    paddingBottom: 20,
  },

    // SafeAreaView для адаптивности под разные телефоны
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

// Экспортируем цвета для использования в других компонентах
export { COLORS, SPACING, FONTS };