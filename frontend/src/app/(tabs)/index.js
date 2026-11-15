import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import {
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getInsights,
} from '../../api/transactions';
import InsightCard from '../../components/InsightCard';
import SectionCard from '../../components/SectionCard';
import TransactionCard from '../../components/TransactionCard';
import ActionModal from '../../components/ActionModal';
import AddExpenseModal from '../../components/AddExpenseModal';
import VoiceRecordButton from '../../components/VoiceRecordButton';
import InsightsModal from '../../components/InsightsModal';
import { colors, radii, spacing, text as t } from '../../theme/theme';

const TAB_BAR_HEIGHT = 76;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  
  // Стейты для инсайтов
  const [patterns, setPatterns] = useState([]);
  const [fullInsightsData, setFullInsightsData] = useState(null);
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);

  const lastTapTime = useRef(0);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      const sorted = (data || []).sort(
        (a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at)
      );
      setTransactions(sorted.slice(0, 3));
    } catch (e) {
      console.error('Ошибка загрузки трат:', e);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const data = await getInsights(fmt(start), fmt(now));
      
      setFullInsightsData(data);
      
      if (data?.patterns && data.patterns.length > 0) {
        setPatterns(data.patterns);
      } else if (data?.financial_health?.explanation) {
        setPatterns([data.financial_health.explanation]);
      } else {
        setPatterns([]);
      }
    } catch (e) {
      console.error('Ошибка загрузки инсайтов:', e);
      // ВАЖНО: выводим точную причину 400 ошибки от бэкенда
      if (e.response?.data?.detail) {
        console.error('🔴 Детали ошибки от бэка:', e.response.data.detail);
      }
      setPatterns([]);
      setFullInsightsData(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadInsights();
    }, [loadTransactions, loadInsights])
  );

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const handleTransactionPress = async (item) => {
    if (item.status !== 'pending') return;
    const now = Date.now();
    if (now - lastTapTime.current < 1000 && pendingConfirmId === item.id) {
      try {
        await updateTransaction(item.id, { status: 'confirmed' });
        loadTransactions();
        setPendingConfirmId(null);
      } catch (e) {
        console.error('Ошибка подтверждения:', e);
      }
    } else {
      setPendingConfirmId(item.id);
      lastTapTime.current = now;
      setTimeout(() => setPendingConfirmId(null), 1000);
    }
  };

  const handleLongPress = (item) => {
    setSelectedTransaction(item);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    try {
      await deleteTransaction(selectedTransaction.id);
      setModalVisible(false);
      setSelectedTransaction(null);
      loadTransactions();
    } catch (e) {
      console.error('Ошибка удаления:', e);
    }
  };

  const handleEdit = () => {
    if (!selectedTransaction) return;
    router.push({
      pathname: '/edit-expense',
      params: {
        id: selectedTransaction.id,
        amount: String(selectedTransaction.amount),
        category_id: selectedTransaction.category_id,
        description: selectedTransaction.description,
        transaction_date: selectedTransaction.transaction_date,
      },
    });
    setModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Привет!</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>

        <InsightCard
          patterns={patterns}
          fallbackText="Начни добавлять траты — ИИ проанализирует их"
          onPress={() => fullInsightsData && setInsightsModalVisible(true)}
        />

        <SectionCard title="ПОСЛЕДНИЕ ТРАТЫ" onArrowPress={() => router.push('/(tabs)/transactions')}>
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleTransactionPress(item)}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <TransactionCard
                  description={item.description}
                  categoryName={item.category_name || 'Прочее'}
                  date={item.transaction_date}
                  amount={item.amount}
                  status={item.status}
                  isReadyToConfirm={pendingConfirmId === item.id}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.empty}>Пока нет трат</Text>
          )}
        </SectionCard>
      </View>

      <View style={[styles.addControls, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 }]}>
        <VoiceRecordButton onResult={() => loadTransactions()} />
        <TouchableOpacity style={styles.textButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.textButtonText}>Ввести текстом</Text>
        </TouchableOpacity>
      </View>

      <ActionModal
        visible={modalVisible}
        title={selectedTransaction?.description || ''}
        onClose={() => { setModalVisible(false); setSelectedTransaction(null); }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddExpenseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onExpenseAdded={loadTransactions}
      />

      <InsightsModal
        visible={insightsModalVisible}
        onClose={() => setInsightsModalVisible(false)}
        data={fullInsightsData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  greeting: { ...t.h1 },
  date: { ...t.caption, marginBottom: spacing.lg },
  empty: { ...t.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  addControls: {
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  textButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.chip,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textButtonText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: colors.lavenderDeep },
});