import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useState, useCallback } from 'react';
import { getTransactions, getCategories, deleteTransaction } from '../../api/transactions';
import { transactionsStyles as styles } from '../../styles/transactionsStyles';
import TransactionCard from '../../components/TransactionCard';
import ActionModal from '../../components/ActionModal';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [categoriesData, transactionsData] = await Promise.all([
        getCategories(),
        getTransactions(),
      ]);

      setCategories(categoriesData);

      const confirmed = transactionsData.filter((t) => t.status === 'confirmed');
      const sorted = confirmed.sort(
        (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
      );
      setTransactions(sorted);
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Без категории';
  };

  const handleDelete = async () => {
    console.log('=== НАЧАЛО УДАЛЕНИЯ ===');
    console.log('Выбранная транзакция:', selectedTransaction);
    
    if (!selectedTransaction) {
      console.log('❌ Нет выбранной транзакции');
      return;
    }
    
    console.log('✅ Вызвана handleDelete, ID:', selectedTransaction.id);
    
    try {
      console.log('📡 Отправляем DELETE запрос...');
      await deleteTransaction(selectedTransaction.id);
      console.log('✅ Удаление успешно!');
      
      setTransactions((prev) => {
        console.log('Обновляем список, было:', prev.length);
        const newTransactions = prev.filter((t) => t.id !== selectedTransaction.id);
        console.log('Стало:', newTransactions.length);
        return newTransactions;
      });
      
      setModalVisible(false);
      setSelectedTransaction(null);
      console.log('=== КОНЕЦ УДАЛЕНИЯ ===');
    } catch (e) {
      console.error(' Ошибка удаления:', e);
      console.error('Детали:', e.response?.data);
      alert(`Не удалось удалить трату: ${e.message}`);
    }
  };

  const handleEdit = () => {
    if (!selectedTransaction) return;
    
    // Переходим на экран редактирования с параметрами
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

  const handleLongPress = (item) => {
    setSelectedTransaction(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Все траты</Text>
      <Text style={styles.hint}>Долгое нажатие для действий</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleLongPress(item)}
            delayLongPress={500}
            style={({ pressed }) => [
              styles.pressable,
              pressed && styles.pressableActive,
            ]}
          >
            <TransactionCard
              description={item.description}
              categoryName={getCategoryName(item.category_id)}
              date={item.transaction_date}
              amount={item.amount}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Пока нет подтверждённых трат</Text>
        }
      />

      {/* Модальное окно с действиями */}
      <ActionModal
        visible={modalVisible}
        title={selectedTransaction?.description || ''}
        onClose={() => {
          setModalVisible(false);
          setSelectedTransaction(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </View>
  );
}