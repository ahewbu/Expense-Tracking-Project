import { View, Text, StyleSheet } from 'react-native';
import { formatTransactionDate } from '../utils/date';
import { capitalizeFirst } from '../utils/text';
import { getCategoryColor } from '../utils/categoryColors';

export default function TransactionCard({ description, categoryName, date, amount, status, isReadyToConfirm }) {
  const formattedDate = formatTransactionDate(date);
  const capitalizedDescription = capitalizeFirst(description || '');
  const categoryColor = getCategoryColor(categoryName);
  const isPending = status === 'pending';

  return (
    <View style={styles.card}>
      <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{capitalizedDescription}</Text>
          {isPending && (
            <View style={[styles.pendingBadge, isReadyToConfirm && styles.readyToConfirmBadge]}>
              <Text style={[styles.pendingText, isReadyToConfirm && styles.readyToConfirmText]}>
                {isReadyToConfirm ? 'Ещё раз!' : 'Ожидает'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{categoryName} · {formattedDate}</Text>
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
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 6 },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '500', color: '#1C1917' },
  subtitle: { fontSize: 13, color: '#A8A29E', marginTop: 4 },
  amount: { fontSize: 16, fontWeight: '600', color: '#F59E0B', marginTop: 4 },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingText: { color: '#D97706', fontSize: 11, fontWeight: '600' },
  readyToConfirmBadge: { backgroundColor: '#6366F1' },
  readyToConfirmText: { color: '#FFFFFF' },
});