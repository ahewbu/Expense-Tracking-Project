import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { createTransaction } from '../api/transactions';

export default function AddExpenseScreen() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!text.trim()) {
      setError('Введите описание траты');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await createTransaction(text.trim());
      setText('');
      router.back(); // Возврат на главный — список обновится сам
    } catch (e) {
      console.error('Ошибка добавления:', e);
      setError(e.response?.data?.detail || 'Не удалось добавить трату. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Новая трата</Text>
      <Text style={styles.subtitle}>Опиши трату своими словами — ИИ распознает сумму и категорию</Text>

      <TextInput
        style={styles.input}
        placeholder="Например: кофе за 250 рублей"
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
      />

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleAdd}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Добавляем...' : 'Добавить'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1917', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#A8A29E', marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: { color: '#DC2626', fontSize: 14, marginTop: 12 },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});