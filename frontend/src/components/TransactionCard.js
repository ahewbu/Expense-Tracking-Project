import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTransactionDate } from '../utils/date';
import { capitalizeFirst } from '../utils/text';
import { getCategoryIcon, getCategoryColor } from '../theme/icons';
import { colors, radii } from '../theme/theme';

export default function TransactionCard({ description, categoryName, date, amount, status, isReadyToConfirm }) {
  const iconName = getCategoryIcon(categoryName);
  const color = getCategoryColor(categoryName);
  const isPending = status === 'pending';

  return (
    <View style={[styles.card, isReadyToConfirm && styles.readyCard]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={iconName} size={20} color={color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {capitalizeFirst(description || '')}
        </Text>
        <View style={styles.metaRow}>
          {isPending && <View style={styles.statusDot} />}
          <Text style={styles.subtitle}>
            {categoryName} · {formatTransactionDate(date)}
          </Text>
        </View>
        {isPending && (
          <Text style={styles.hint}>
            {isReadyToConfirm ? 'Нажми ещё раз' : 'Нажми дважды для подтверждения'}
          </Text>
        )}
      </View>

      <Text style={styles.amount}>{amount} ₽</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderRadius: radii.button },
  readyCard: { backgroundColor: colors.lavenderSoft },
  iconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontFamily: 'Ubuntu_500Medium', fontSize: 15, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sand },
  subtitle: { fontFamily: 'Ubuntu_400Regular', fontSize: 12, color: colors.textMuted },
  hint: { fontFamily: 'Ubuntu_400Regular', fontSize: 11, color: colors.lavenderDeep, marginTop: 2 },
  amount: { fontFamily: 'Ubuntu_700Bold', fontSize: 15, color: colors.text, marginLeft: 8 },
});