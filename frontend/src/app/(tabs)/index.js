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
import { homeStyles } from '../../styles/homeStyles';
import InsightCard from '../../components/InsightCard';
import SectionCard from '../../components/SectionCard';
import ActionModal from '../../components/ActionModal';
import AddExpenseModal from '../../components/AddExpenseModal';
import VoiceRecordButton from '../../components/VoiceRecordButton';
import { capitalizeFirst } from '../../utils/text';
import { getCategoryColor } from '../../utils/categoryColors';

const TAB_BAR_HEIGHT = 76;

const local = StyleSheet.create({
  pendingItemHighlight: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  readyToConfirmHighlight: { backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#6366F1' },
  pendingBadgeText: { fontSize: 11, color: '#D97706', marginTop: 4, fontWeight: '600' },
  screen: { flex: 1, backgroundColor: '#FAFAF9' },
  content: { padding: 24, paddingBottom: 12 },
  spacer: { flex: 1, minHeight: 8 },
  addControls: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    backgroundColor: '#FAFAF9',
  },
  textButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  textButtonText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },
});
const styles = { ...homeStyles, ...local };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const [insightText, setInsightText] = useState('Анализируем твои траты...');
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
      setInsightText(data?.short_insight || 'Здесь будут инсайты от ИИ. Начни добавлять траты!');
    } catch (e) {
      console.error('Ошибка загрузки инсайтов:', e);
      setInsightText('Здесь будут инсайты от ИИ. Скоро я начну анализировать твои траты!');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadInsights();
    }, [loadTransactions, loadInsights])
  );

  const getFormattedDate = () => {
    const today = new Date();
    return `Сегодня, ${today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
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
    <View style={[styles.screen, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Привет! 👋</Text>
        <Text style={styles.dateText}>{getFormattedDate()}</Text>

        <InsightCard text={insightText} />

        <SectionCard
          title="Последние траты"
          onArrowPress={() => router.push('/(tabs)/transactions')}
        >
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.transactionItem,
                  item.status === 'pending' && styles.pendingItemHighlight,
                  pendingConfirmId === item.id && styles.readyToConfirmHighlight,
                ]}
                onPress={() => handleTransactionPress(item)}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.transactionDot,
                    { backgroundColor: getCategoryColor(item.category_name || 'Без категории') },
                  ]}
                />
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{capitalizeFirst(item.description || '')}</Text>
                  <Text style={styles.transactionCategory}>{item.category_name || 'Без категории'}</Text>
                  {item.status === 'pending' && (
                    <Text style={styles.pendingBadgeText}>
                      {pendingConfirmId === item.id ? 'Нажми ещё раз для подтверждения' : 'Нажми дважды для подтверждения'}
                    </Text>
                  )}
                </View>
                <Text style={styles.transactionAmount}>{item.amount} ₽</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Пока нет трат</Text>
          )}
        </SectionCard>
      </View>

      <View style={styles.spacer} />

      <View style={styles.addControls}>
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
    </View>
  );
}