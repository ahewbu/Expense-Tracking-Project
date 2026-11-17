import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { getStatsSummary } from '../../api/transactions';
import { getCategoryStyle } from '../../theme/icons';
import { colors, radii, text as t } from '../../theme/theme';
import DonutChart from '../../components/DonutChart';
import ScrollableLegend from '../../components/ScrollableLegend';

const PERIOD_PRESETS = [
  { id: 'week', label: 'Эта неделя', icon: 'calendar' },
  { id: 'month', label: 'Этот месяц', icon: 'calendar' },
  { id: 'last_month', label: 'Прошлый месяц', icon: 'calendar' },
  { id: 'year', label: 'Этот год', icon: 'calendar' },
  { id: 'all', label: 'Всё время', icon: 'time' },
];

export default function AnalyticsScreen() {
  const [stats, setStats] = useState(null);
  const [prevStats, setPrevStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [calendarModal, setCalendarModal] = useState(false);

  const dateRanges = useMemo(() => {
    const now = new Date();
    let currentStart, currentEnd, prevStart, prevEnd;
    let label = '';

    switch (period) {
      case 'week': {
        currentEnd = now;
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - 7);
        prevEnd = new Date(currentStart);
        prevEnd.setDate(currentStart.getDate() - 1);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevEnd.getDate() - 7);
        label = 'Последние 7 дней';
        break;
      }
      case 'month': {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        label = `${getMonthYearLabel(now)}`;
        break;
      }
      case 'last_month': {
        currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        label = `${getMonthYearLabel(currentStart)}`;
        break;
      }
      case 'year': {
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear() - 1, 0, 1);
        prevEnd = new Date(now.getFullYear() - 1, 11, 31);
        label = `${now.getFullYear()} год`;
        break;
      }
      case 'all': {
        currentStart = new Date(2020, 0, 1);
        currentEnd = now;
        prevStart = null;
        prevEnd = null;
        label = 'Всё время';
        break;
      }
      default:
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        label = getMonthYearLabel(now);
    }

    return { currentStart, currentEnd, prevStart, prevEnd, label };
  }, [period]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const currentData = await getStatsSummary(fmt(dateRanges.currentStart), fmt(dateRanges.currentEnd));
      setStats(currentData);

      if (dateRanges.prevStart && dateRanges.prevEnd) {
        const prevData = await getStatsSummary(fmt(dateRanges.prevStart), fmt(dateRanges.prevEnd));
        setPrevStats(prevData);
      } else {
        setPrevStats(null);
      }
    } catch (e) {
      console.error('Ошибка загрузки статистики:', e);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  }, [dateRanges]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);

  const changePercent = useMemo(() => {
    if (!stats || !prevStats) return null;
    const current = stats.total;
    const prev = prevStats.total;
    if (prev === 0) return null;
    return ((current - prev) / prev) * 100;
  }, [stats, prevStats]);

  const chartData = stats?.by_category?.map((cat) => {
    const style = getCategoryStyle(cat.category_name);
    return {
      name: cat.category_name,
      amount: cat.total,
      color: style.color,
    };
  }) || [];

  const total = stats?.total || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Заголовок периода */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Расходы за период</Text>
          <TouchableOpacity style={styles.periodTitleRow} onPress={() => setCalendarModal(true)}>
            <Text style={styles.periodTitle}>{dateRanges.label}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={() => setCalendarModal(true)}>
          <Ionicons name="calendar-outline" size={22} color={colors.lavenderDeep} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lavender} />
          <Text style={styles.loadingText}>Загружаем...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.terracotta} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
            <Text style={styles.retryText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && stats && (
        <>
          {/* Donut chart */}
          {chartData.length > 0 ? (
            <View style={styles.chartCard}>
              <DonutChart
                data={chartData}
                total={total}
                centerLabel="Всего"
                centerAmount={formatCurrency(total)}
                changePercent={changePercent}
              />
              
              {/* Легенда */}
              <ScrollableLegend data={chartData} total={total} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Нет данных за этот период</Text>
              <Text style={styles.emptySubtext}>Добавь траты, чтобы увидеть аналитику</Text>
            </View>
          )}

          {/* Список категорий с прогресс-барами */}
          {chartData.length > 0 && (
            <View style={styles.listCard}>
              <Text style={styles.listTitle}>По категориям</Text>
              {chartData.map((cat, index) => {
                const percent = total > 0 ? (cat.amount / total) * 100 : 0;
                return (
                  <View key={index} style={styles.categoryRow}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        <Text style={styles.categoryPercent}>{percent.toFixed(1)}%</Text>
                      </View>
                      <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${percent}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Модалка выбора периода */}
      <Modal visible={calendarModal} transparent animationType="slide" onRequestClose={() => setCalendarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите период</Text>
              <TouchableOpacity onPress={() => setCalendarModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.presetsList}>
              {PERIOD_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetItem, period === preset.id && styles.presetItemActive]}
                  onPress={() => {
                    setPeriod(preset.id);
                    setCalendarModal(false);
                  }}
                >
                  <Ionicons
                    name={preset.icon}
                    size={20}
                    color={period === preset.id ? colors.lavenderDeep : colors.textMuted}
                  />
                  <Text style={[styles.presetText, period === preset.id && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                  {period === preset.id && (
                    <Ionicons name="checkmark" size={20} color={colors.lavenderDeep} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const getMonthYearLabel = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerLeft: { flex: 1 },
  headerLabel: { ...t.caption, color: colors.textMuted, marginBottom: 4 },
  periodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodTitle: { ...t.h1 },
  calendarButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.lavenderSoft,
    justifyContent: 'center', alignItems: 'center',
  },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: colors.textMuted, fontSize: 14 },
  errorText: { color: colors.terracotta, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryButton: { marginTop: 16, backgroundColor: colors.lavender, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.button },
  retryText: { color: '#FFFFFF', fontWeight: '600' },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { ...t.body, marginTop: 12, color: colors.text },
  emptySubtext: { ...t.caption, color: colors.textMuted, marginTop: 4 },

  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listTitle: { ...t.h3, marginBottom: 16 },
  categoryRow: { marginBottom: 16 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryName: { ...t.body },
  categoryPercent: { ...t.caption, color: colors.textMuted },
  categoryAmount: { ...t.body, fontWeight: '600', color: colors.text },
  progressBarBg: { height: 6, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...t.h2 },
  presetsList: { gap: 4 },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.button,
    gap: 12,
  },
  presetItemActive: { backgroundColor: colors.lavenderSoft },
  presetText: { flex: 1, ...t.body },
  presetTextActive: { color: colors.lavenderDeep, fontWeight: '600' },
});