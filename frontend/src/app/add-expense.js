import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function AddExpenseScreen() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Имитируем парсинг ИИ, но НЕ сохраняем в mock
      const amountMatch = text.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 0;
      
      const parsedData = {
        id: String(Date.now()), // временный ID
        text: text,
        amount: amount,
        category: 'Другое',
        date: new Date().toISOString().split('T')[0],
      };
      
      // Переход на экран подтверждения с параметрами
      router.push({
        pathname: '/confirm',
        params: {
          id: parsedData.id,
          amount: String(parsedData.amount),
          category: parsedData.category,
          date: parsedData.date,
          description: parsedData.text,
        },
      });
      
    } catch (e) {
      alert('Не удалось распознать расход');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Опишите трату</Text>
      <Text style={styles.hint}>Например: "кофе 350 рублей" или "обед 800"</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Введите текст..."
        placeholderTextColor="#A8A29E"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  content: { padding: 20, paddingTop: 60, flexGrow: 1 },
  label: { fontSize: 20, fontWeight: '600', color: '#1C1917', marginBottom: 8 },
  hint: { fontSize: 14, color: '#57534E', marginBottom: 20 },
  input: { 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E7E5E4', 
    borderRadius: 16, 
    padding: 16, 
    fontSize: 16, 
    color: '#1C1917', 
    minHeight: 100, 
    marginBottom: 24 
  },
  button: { backgroundColor: '#6366F1', borderRadius: 16, padding: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});