import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getTransactions } from '../mocks/transactions';

export default function HomeScreen() {
  const [transactions, setTransactions] = useState([]);

  const loadTransactions = () => {
    getTransactions().then(setTransactions);
  };

  // Перезагружаем данные каждый раз, когда экран становится активным
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Привет, Анна! 👋</Text>
      <Text style={styles.subtitle}>Вторник, 8 октября</Text>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{item.text}</Text>
              <Text style={styles.cardSubtitle}>{item.category} · {item.time}</Text>
            </View>
            <Text style={styles.cardAmount}>{item.amount} ₽</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>Пока нет трат. Добавь первую!</Text>}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/add-expense')} 
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '600', color: '#1C1917', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#57534E', marginBottom: 24 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#1C1917' },
  cardSubtitle: { fontSize: 13, color: '#A8A29E', marginTop: 4 },
  cardAmount: { fontSize: 16, fontWeight: '600', color: '#F59E0B' },
  fab: { position: 'absolute', right: 20, bottom: 40, width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { color: '#FFF', fontSize: 32, marginTop: -4 },
  empty: { textAlign: 'center', color: '#A8A29E', marginTop: 40, fontSize: 16 }
});