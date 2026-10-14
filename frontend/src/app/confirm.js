import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { createTransaction } from '../mocks/transactions';

const CATEGORIES = ['Кафе', 'Продукты', 'Транспорт', 'Развлечения', 'Другое'];

export default function ConfirmScreen() {
  const params = useLocalSearchParams();
  
  console.log('=== ConfirmScreen loaded ===');
  console.log('Params:', params);
  
  const [amount, setAmount] = useState(params.amount || '0');
  const [category, setCategory] = useState(params.category || 'Другое');
  const [date, setDate] = useState(params.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(params.description || 'Без описания');
  const [isEditing, setIsEditing] = useState(false);

  const validate = () => {
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Ошибка: Сумма должна быть больше 0');
      return false;
    }
    const today = new Date().toISOString().split('T')[0]; // "2026-10-14" в локальном времени
    if (date > today) {
      alert('Ошибка: Дата не может быть в будущем');
      return false;
    }
    return true;
  };

  const handleSaveEdit = () => {
    console.log('handleSaveEdit called');
    if (validate()) {
      setIsEditing(false);
      console.log('Edit saved');
    }
  };

  const handleCancelEdit = () => {
    console.log('handleCancelEdit called');
    setAmount(params.amount || '0');
    setCategory(params.category || 'Другое');
    setDate(params.date || new Date().toISOString().split('T')[0]);
    setDescription(params.description || 'Без описания');
    setIsEditing(false);
  };

  const handleConfirm = async () => {
    console.log('handleConfirm called');
    if (!validate()) {
      console.log('Validation failed');
      return;
    }

    try {
      console.log('Creating transaction with data:', {
        id: params.id,
        text: description,
        amount: parseFloat(amount),
        category: category,
        date: date,
      });
      
      await createTransaction({
        id: params.id || String(Date.now()),
        text: description,
        amount: parseFloat(amount),
        category: category,
        date: date,
      });
      
      console.log('Transaction created successfully');
      alert('Трата добавлена!');
      router.push('/');
    } catch (e) {
      console.error('Error:', e);
      alert('Ошибка: Не удалось сохранить');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Проверьте данные</Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Внесите исправления' : 'ИИ распознал вашу трату'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Сумма (₽)</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
          />
        ) : (
          <Text style={styles.value}>{amount} ₽</Text>
        )}

        <Text style={styles.label}>Категория</Text>
        {isEditing ? (
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => {
                  console.log('Category selected:', cat);
                  setCategory(cat);
                }}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.value}>{category}</Text>
        )}

        <Text style={styles.label}>Дата (ГГГГ-ММ-ДД)</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-14"
          />
        ) : (
          <Text style={styles.value}>{date}</Text>
        )}

        <Text style={styles.label}>Описание</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        ) : (
          <Text style={styles.valueDescription}>{description}</Text>
        )}
      </View>

      {isEditing ? (
        <>
          <TouchableOpacity style={styles.buttonConfirm} onPress={handleSaveEdit}>
            <Text style={styles.buttonConfirmText}>✓ Сохранить изменения</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonEdit} onPress={handleCancelEdit}>
            <Text style={styles.buttonEditText}>✕ Отмена</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm}>
            <Text style={styles.buttonConfirmText}>✓ Подтвердить</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.buttonEdit} 
            onPress={() => {
              console.log('Edit button pressed');
              setIsEditing(true);
            }}
          >
            <Text style={styles.buttonEditText}>✎ Исправить</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  content: { padding: 20, paddingTop: 40, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1C1917', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#57534E', marginBottom: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24 },
  label: { fontSize: 13, color: '#A8A29E', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 18, fontWeight: '600', color: '#F59E0B', paddingVertical: 8 },
  valueDescription: { fontSize: 16, color: '#1C1917', paddingVertical: 8 },
  input: { backgroundColor: '#F5F5F4', borderRadius: 12, padding: 12, fontSize: 16, color: '#1C1917', borderWidth: 1, borderColor: '#E7E5E4' },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F4', borderWidth: 1, borderColor: '#E7E5E4' },
  catBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  catText: { fontSize: 14, color: '#57534E' },
  catTextActive: { color: '#6366F1', fontWeight: '600' },
  buttonConfirm: { backgroundColor: '#6366F1', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  buttonConfirmText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  buttonEdit: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#E7E5E4' },
  buttonEditText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
});