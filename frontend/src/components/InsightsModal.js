import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, text as t } from '../theme/theme';

export default function InsightsModal({ visible, onClose, data }) {
  if (!data) return null;

  const { financial_health, top_categories, recommendations, savings_potential, summary } = data;

  const healthColors = {
    excellent: '#10B981',
    good: '#84CC16',
    normal: '#F59E0B',
    warning: '#F97316',
    critical: '#EF4444',
  };
  const healthColor = healthColors[financial_health?.score] || colors.textMuted;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Полный AI-анализ</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* 1. Финансовое здоровье */}
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: healthColor }]}>
              <View style={styles.row}>
                <Ionicons name="heart" size={20} color={healthColor} />
                <Text style={[t.h2, { marginLeft: 8, color: healthColor }]}>{financial_health.label}</Text>
              </View>
              <Text style={[t.body, { marginTop: 8, color: colors.textSecondary }]}>
                {financial_health.explanation}
              </Text>
            </View>

            {/* 2. Краткая сводка */}
            <View style={styles.card}>
              <Text style={[t.label, { marginBottom: 12 }]}>Сводка за период</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={t.caption}>Всего трат</Text>
                  <Text style={t.amount}>{summary.total.toLocaleString('ru-RU')} ₽</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={t.caption}>Транзакций</Text>
                  <Text style={t.amount}>{summary.transactions_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={t.caption}>Средний чек</Text>
                  <Text style={t.amount}>{Math.round(summary.average_check).toLocaleString('ru-RU')} ₽</Text>
                </View>
              </View>
            </View>

            {/* 3. Топ категорий */}
            {top_categories.length > 0 && (
              <View style={styles.card}>
                <Text style={[t.label, { marginBottom: 12 }]}>Топ категорий</Text>
                {top_categories.map((cat, idx) => (
                  <View key={idx} style={styles.categoryRow}>
                    <View style={styles.catInfo}>
                      <Text style={t.body}>{cat.name}</Text>
                      <Text style={t.caption}>{cat.type === 'mandatory' ? 'Обязательная' : 'Опциональная'}</Text>
                    </View>
                    <View style={styles.catAmount}>
                      <Text style={t.amount}>{cat.total.toLocaleString('ru-RU')} ₽</Text>
                      <Text style={[t.caption, { color: colors.lavenderDeep }]}>{cat.percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 4. Рекомендации */}
            {recommendations.length > 0 && (
              <View style={styles.card}>
                <Text style={[t.label, { marginBottom: 12 }]}>Рекомендации по оптимизации</Text>
                {recommendations.map((rec, idx) => (
                  <View key={idx} style={styles.recRow}>
                    <View style={styles.recHeader}>
                      <Text style={[t.body, { fontWeight: '600' }]}>{rec.category}</Text>
                      <Text style={[t.caption, { color: colors.oliveDeep }]}>
                        Экономия: {rec.savings.toLocaleString('ru-RU')} ₽
                      </Text>
                    </View>
                    <Text style={[t.body, { color: colors.textSecondary, marginTop: 4 }]}>{rec.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 5. Потенциал экономии */}
            <View style={[styles.card, { backgroundColor: colors.oliveSoft }]}>
              <View style={styles.row}>
                <Ionicons name="wallet" size={20} color={colors.oliveDeep} />
                <Text style={[t.h2, { marginLeft: 8, color: colors.oliveDeep }]}>Потенциал экономии</Text>
              </View>
              <Text style={[t.amount, { fontSize: 24, color: colors.oliveDeep, marginTop: 8 }]}>
                ~{savings_potential.total.toLocaleString('ru-RU')} ₽
              </Text>
              <Text style={[t.body, { color: colors.textSecondary, marginTop: 4 }]}>
                {savings_potential.text}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    height: '85%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...t.h2 },
  closeButton: { padding: 4 },
  scroll: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catInfo: { flex: 1 },
  catAmount: { alignItems: 'flex-end' },
  recRow: { marginBottom: spacing.md },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});