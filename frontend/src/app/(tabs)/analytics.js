import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getStatsSummary } from '../../api/transactions';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); // 'week' | 'month' | 'all'

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let start;
      
      if (period === 'week') {
        start = new Date(now);
        start.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        start = new Date(2020, 0, 1); // "За всё время"
      }

      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const data = await getStatsSummary(fmt(start), fmt(now));
      setStats(data);
    } catch (e) {
      console.error('Ошибка загрузки статистики:', e);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  // Цвета для секторов
  const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Данные для PieChart
  const chartData = stats?.by_category?.map((cat, index) => ({
    name: cat.category_name,
    amount: cat.total,
    color: COLORS[index % COLORS.length],
    legendFontColor: '#1C1917',
    legendFontSize: 13,
  })) || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Аналитика</Text>

      {/* Переключатель периода */}
      <View style={styles.periodSwitcher}>
        {['week', 'month', 'all'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Загружаем статистику...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
            <Text style={styles.retryText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && stats && (
        <>
          {/* Общая сумма */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Всего расходов за период</Text>
            <Text style={styles.totalAmount}>{formatCurrency(stats.total)}</Text>
            <Text style={styles.totalCount}>
              {stats.by_category?.length || 0} {stats.by_category?.length === 1 ? 'категория' : 'категорий'}
            </Text>
          </View>

          {/* PieChart */}
          {chartData.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Распределение по категориям</Text>
              <PieChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(28, 25, 23, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="16"
                absolute
              />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Нет данных за выбранный период</Text>
              <Text style={styles.emptySubtext}>Добавь траты, чтобы увидеть аналитику</Text>
            </View>
          )}

          {/* Список категорий с суммами */}
          {chartData.length > 0 && (
            <View style={styles.listCard}>
              <Text style={styles.listTitle}>Детализация</Text>
              {chartData.map((cat, index) => {
                const percent = stats.total > 0 ? ((cat.amount / stats.total) * 100).toFixed(1) : 0;
                return (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{cat.name}</Text>
                      <Text style={styles.listItemPercent}>{percent}%</Text>
                    </View>
                    <Text style={styles.listItemAmount}>{formatCurrency(cat.amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  content: { padding: 24, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1917', marginBottom: 20 },

  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodButtonActive: { backgroundColor: '#6366F1' },
  periodText: { fontSize: 14, fontWeight: '500', color: '#A8A29E' },
  periodTextActive: { color: '#FFFFFF', fontWeight: '600' },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#A8A29E', fontSize: 14 },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },

  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  totalLabel: { fontSize: 14, color: '#A8A29E', marginBottom: 8 },
  totalAmount: { fontSize: 32, fontWeight: '700', color: '#1C1917' },
  totalCount: { fontSize: 13, color: '#A8A29E', marginTop: 4 },

  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#1C1917', marginBottom: 12 },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1C1917' },
  emptySubtext: { fontSize: 13, color: '#A8A29E', marginTop: 8 },

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#1C1917', marginBottom: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 15, fontWeight: '500', color: '#1C1917' },
  listItemPercent: { fontSize: 12, color: '#A8A29E', marginTop: 2 },
  listItemAmount: { fontSize: 15, fontWeight: '600', color: '#F59E0B' },
});