import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { getTransactions, deleteTransaction, updateTransaction } from '../../api/transactions';
import { transactionsStyles } from '../../styles/transactionsStyles';
import TransactionCard from '../../components/TransactionCard';
import ActionModal from '../../components/ActionModal';

const local = StyleSheet.create({
  pendingItemHighlight: { backgroundColor: '#FEF3C7', borderRadius: 16, borderWidth: 1, borderColor: '#F59E0B' },
  readyToConfirmHighlight: { backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#6366F1' },
});
const styles = { ...transactionsStyles, ...local };

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [pendingConfirmId, setPendingConfirmId] = useState(null);
  const lastTapTime = useRef(0);

  const loadData = useCallback(async () => {
    try {
      const data = await getTransactions();
      // Показываем ВСЕ траты (pending + confirmed)
      const sorted = (data || []).sort(
        (a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at)
      );
      setTransactions(sorted);
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTransactionPress = async (item) => {
    if (item.status !== 'pending') return;
    const now = Date.now();
    if (now - lastTapTime.current < 1000 && pendingConfirmId === item.id) {
      try {
        await updateTransaction(item.id, { status: 'confirmed' });
        await loadData();
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
      await loadData();
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
      <Text style={styles.title}>Все траты</Text>
      <Text style={styles.hint}>Двойное нажатие — подтвердить, долгое — действия</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleTransactionPress(item)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={500}
            style={({ pressed }) => [
              styles.pressable,
              pressed && styles.pressableActive,
              item.status === 'pending' && styles.pendingItemHighlight,
              pendingConfirmId === item.id && styles.readyToConfirmHighlight,
            ]}
          >
            <TransactionCard
              description={item.description}
              categoryName={item.category_name || 'Без категории'}
              date={item.transaction_date}
              amount={item.amount}
              status={item.status}
              isReadyToConfirm={pendingConfirmId === item.id}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} tintColor="#6366F1" />
        }
        ListEmptyComponent={<Text style={styles.empty}>Пока нет трат</Text>}
      />

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