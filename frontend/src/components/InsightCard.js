import { View, Text, StyleSheet } from 'react-native';

/**
 * Блок с инсайтами от ИИ.
 * Пока заглушка, позже сюда подключим реальные данные.
 * 
 * Пропсы:
 * - text: строка (текст инсайта)
 */
export default function InsightCard({ text }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💡 Инсайты от ИИ</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
  },

  text: {
    fontSize: 14,
    color: '#57534E',
    lineHeight: 20,
  },
});