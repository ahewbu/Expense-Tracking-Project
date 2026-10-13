import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { createTransaction } from '../mocks/transactions';

export default function AddExpenseScreen() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // Для отображения результата

  const handleAdd = async () => {
    if (!text.trim()) {
      console.log('Ошибка: текст пустой');
      return;
    }
    
    setIsLoading(true);
    console.log('Начинаем добавление:', text);
    
    try {
      const newTransaction = await createTransaction(text);
      console.log('Результат:', newTransaction);
      
      setResult(newTransaction); // Показываем результат на экране
      
      // Ждем 1.5 секунды и возвращаемся на главный экран
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (e) {
      console.log('Ошибка:', e);
      setResult({ error: 'Не удалось добавить расход' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Опишите трату</Text>
      <Text style={styles.hint}>Например: "кофе 350 рублей"</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Введите текст..."
        placeholderTextColor="#A8A29E"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={3}
      />
      
      <TouchableOpacity 
        style={[styles.button, (!text.trim() || isLoading) && styles.buttonDisabled]} 
        onPress={handleAdd}
        disabled={!text.trim() || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'ИИ думает...' : 'Добавить'}
        </Text>
      </TouchableOpacity>

      {/* Отображение результата */}
      {result && (
        <View style={styles.resultCard}>
          {result.error ? (
            <Text style={styles.resultError}>{result.error}</Text>
          ) : (
            <>
              <Text style={styles.resultTitle}>✅ Расход добавлен!</Text>
              <Text style={styles.resultText}>Сумма: {result.amount} ₽</Text>
              <Text style={styles.resultText}>Категория: {result.category}</Text>
              <Text style={styles.resultHint}>Возврат на главный экран...</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  content: { padding: 20, paddingTop: 60, flexGrow: 1 },
  label: { fontSize: 20, fontWeight: '600', color: '#1C1917', marginBottom: 8 },
  hint: { fontSize: 14, color: '#57534E', marginBottom: 20 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 16, padding: 16, fontSize: 16, color: '#1C1917', minHeight: 100, marginBottom: 24 },
  button: { backgroundColor: '#6366F1', borderRadius: 16, padding: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resultCard: { marginTop: 24, padding: 16, backgroundColor: '#EEF2FF', borderRadius: 16, borderWidth: 1, borderColor: '#6366F1' },
  resultTitle: { fontSize: 18, fontWeight: '600', color: '#6366F1', marginBottom: 8 },
  resultText: { fontSize: 16, color: '#1C1917', marginBottom: 4 },
  resultError: { fontSize: 16, color: '#EF4444', fontWeight: '500' },
  resultHint: { fontSize: 14, color: '#A8A29E', marginTop: 8, fontStyle: 'italic' },
});