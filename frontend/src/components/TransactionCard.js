import { View, Text, StyleSheet } from 'react-native';
import { formatTransactionDate } from '../utils/date';
import { capitalizeFirst } from '../utils/text';
import { getCategoryColor } from '../utils/categoryColors';

/**
 * Компонент карточки транзакции для списка.
 * 
 * Пропсы:
 * - description: строка (описание траты)
 * - categoryName: строка (название категории)
 * - date: строка в формате ISO
 * - amount: число (сумма в рублях)
 */
export default function TransactionCard({ description, categoryName, date, amount }) {
  const formattedDate = formatTransactionDate(date);
  const capitalizedDescription = capitalizeFirst(description);
  const categoryColor = getCategoryColor(categoryName);

  return (
    <View style={styles.card}>
      {/* Цветной кружок категории слева */}
      <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
      
      <View style={styles.info}>
        <Text style={styles.title}>{capitalizedDescription}</Text>
        <Text style={styles.subtitle}>
          {categoryName} · {formattedDate}
        </Text>
      </View>
      
      <Text style={styles.amount}>{amount} ₽</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 6.5,
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1917',
  },

  subtitle: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 4,
  },

  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
});