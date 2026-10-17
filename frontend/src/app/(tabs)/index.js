import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { getTransactions, getCategories } from '../../api/transactions'; 
import { homeStyles as styles } from '../../styles/homeStyles';          
import InsightCard from '../../components/InsightCard';
import SectionCard from '../../components/SectionCard';
import { formatTransactionDate } from '../../utils/date';
import { capitalizeFirst } from '../../utils/text';
import { getCategoryColor } from '../../utils/categoryColors';

export default function HomeScreen() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userName] = useState('Петр');

  useFocusEffect(
    useCallback(() => {
      getCategories()
        .then(setCategories)
        .catch((e) => console.error('Ошибка категорий:', e));

      getTransactions()
        .then((data) => {
          const confirmed = data.filter((t) => t.status === 'confirmed');
          const sorted = confirmed.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setTransactions(sorted.slice(0, 3));
        })
        .catch((e) => console.error('Ошибка загрузки:', e));
    }, [])
  );

  const getFormattedDate = () => {
    const today = new Date();
    return `Сегодня, ${today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Без категории';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Привет, {userName}!</Text>
      <Text style={styles.dateText}>{getFormattedDate()}</Text>

      <InsightCard text="Здесь будут инсайты от ИИ. Скоро я начну анализировать твои траты!" />

      <SectionCard
        title="Последние траты"
        onArrowPress={() => router.push('/(tabs)/transactions')}
      >
        {transactions.length > 0 ? (
          transactions.map((item) => (
            <View key={item.id} style={styles.transactionItem}>
              {/* Цветной кружок категории */}
              <View 
                style={[
                  styles.transactionDot, 
                  { backgroundColor: getCategoryColor(getCategoryName(item.category_id)) }
                ]} 
              />
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>
                  {capitalizeFirst(item.description)}
                </Text>
                <Text style={styles.transactionCategory}>
                  {getCategoryName(item.category_id)} · {formatTransactionDate(item.transaction_date)}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>{item.amount} ₽</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Пока нет трат</Text>
        )}
      </SectionCard>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-expense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}