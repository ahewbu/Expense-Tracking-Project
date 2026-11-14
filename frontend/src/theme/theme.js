/**
 * Единая дизайн-система приложения.
 * ВСЕ цвета, шрифты, тени, радиусы и отступы — только отсюда.
 * В компонентах и экранах хардкод цветов запрещён.
 */

export const colors = {
  // Фон и поверхности
  bg: '#F7F6FB',            // основной фон (тёплый белый с лавандовым подтоном)
  surface: '#FFFFFF',       // карточки
  surfaceMuted: '#F2F1F6',  // вторичные поверхности (инпуты, чипы)
  border: '#E8E6F0',        // hairline границы

  // Текст
  text: '#2F2F2F',          // основной
  textSecondary: '#6B6B70', // вторичный
  textMuted: '#9C9CA3',     // даты, метки

  // Акценты палитры
  lavender: '#C6B4E9',
  lavenderDeep: '#A78BFA',
  lavenderSoft: '#EDE7F8',
  olive: '#D9E096',
  oliveDeep: '#A3B84A',
  oliveSoft: '#F3F5DE',
  sand: '#E8C9A0',          // pending
  terracotta: '#D4736A',    // ошибки/удаление
  white: '#FFFFFF',
};

export const gradients = {
  ai: ['#C6B4E9', '#A78BFA', '#8B5CF6'],      // AI-инсайты
  accent: ['#C6B4E9', '#A78BFA'],             // кнопки, FAB
  success: ['#D9E096', '#A3B84A'],             // позитив
  pending: ['#E8C9A0', '#D9A05B'],             // ожидает
};

export const radii = {
  card: 20,
  button: 16,
  input: 14,
  chip: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadows = {
  card: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  float: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Текстовые стили (Ubuntu)
export const text = {
  h1: { fontFamily: 'Ubuntu_700Bold', fontSize: 28, color: colors.text, letterSpacing: -0.3 },
  h2: { fontFamily: 'Ubuntu_700Bold', fontSize: 22, color: colors.text },
  label: { fontFamily: 'Ubuntu_500Medium', fontSize: 12, color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  body: { fontFamily: 'Ubuntu_400Regular', fontSize: 15, color: colors.text, lineHeight: 22 },
  caption: { fontFamily: 'Ubuntu_400Regular', fontSize: 13, color: colors.textMuted },
  amount: { fontFamily: 'Ubuntu_700Bold', fontSize: 16, color: colors.text },
};