import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { getTransactions, updateTransaction, deleteTransaction } from '../../api/transactions';
import { homeStyles } from '../../styles/homeStyles';
import InsightCard from '../../components/InsightCard';
import SectionCard from '../../components/SectionCard';
import ActionModal from '../../components/ActionModal';
import { capitalizeFirst } from '../../utils/text';

// Стили, которых нет в склонированном homeStyles — добавляем локально
const local = StyleSheet.create({
  pendingItemHighlight: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  readyToConfirmHighlight: { backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#6366F1' },
  pendingBadgeText: { fontSize: 11, color: '#D97706', marginTop: 4, fontWeight: '600' },
});
const styles = { ...homeStyles, ...local };

export default function HomeScreen() {
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const lastTapTime = useRef(0);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      const sorted = (data || []).sort(
        (a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at)
      );
      setTransactions(sorted.slice(0, 3));
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTransactions(); }, [loadTransactions]));

  const getFormattedDate = () => {
    const today = new Date();
    return `Сегодня, ${today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
  };

  // Двойное нажатие — подтвердить трату
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
    <View style={styles.container}>
      <Text style={styles.greeting}>Привет! 👋</Text>
      <Text style={styles.dateText}>{getFormattedDate()}</Text>

      <InsightCard text="Здесь будут инсайты от ИИ. Скоро я начну анализировать твои траты!" />

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
                style={[styles.transactionDot, { backgroundColor: '#6366F1' }]}
              />
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{capitalizeFirst(item.description || '')}</Text>
                <Text style={styles.transactionCategory}>
                  {item.category_name || 'Без категории'}
                </Text>
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

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-expense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ActionModal
        visible={modalVisible}
        title={selectedTransaction?.description || ''}
        onClose={() => { setModalVisible(false); setSelectedTransaction(null); }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </View>
  );
}