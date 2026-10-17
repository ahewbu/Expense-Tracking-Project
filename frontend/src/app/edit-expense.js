import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { updateTransaction, getCategories, createCategory } from '../api/transactions';
import { confirmStyles as styles } from '../styles/confirmStyles';
import CategoryButton from '../components/CategoryButton';

export default function EditExpenseScreen() {
  const params = useLocalSearchParams();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Загружаем данные транзакции и категории
  useFocusEffect(
    useCallback(() => {
      // Загружаем категории
      getCategories()
        .then((data) => {
          setCategories(data);
          
          // Устанавливаем текущую категорию
          const currentCat = data.find((c) => c.id === params.category_id);
          if (currentCat) setCategory(currentCat.name);
        })
        .catch((e) => console.error('Ошибка загрузки категорий:', e));

      // Заполняем форму данными транзакции
      setAmount(String(params.amount || ''));
      setDescription(params.description || '');
      setDate(params.transaction_date ? params.transaction_date.split('T')[0] : '');
    }, [])
  );

  const validate = () => {
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Ошибка', 'Сумма должна быть больше 0');
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      Alert.alert('Ошибка', 'Дата не может быть в будущем');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Находим или создаём категорию
      let categoryUuid = categories.find((c) => c.name === category)?.id;
      if (!categoryUuid) {
        const newCat = await createCategory({ name: category, icon: '' });
        categoryUuid = newCat.id;
      }

      // Обновляем транзакцию
      await updateTransaction(params.id, {
        amount: parseFloat(amount),
        category_id: categoryUuid,
        description: description,
        transaction_date: date,
        status: 'confirmed',
      });

      Alert.alert('Успех', 'Трата обновлена!');
      router.back();
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Редактировать трату</Text>
      <Text style={styles.subtitle}>Внесите изменения</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Сумма (₽)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Категория</Text>
        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <CategoryButton
              key={cat.id}
              name={cat.name}
              isActive={category === cat.name}
              onPress={() => setCategory(cat.name)}
            />
          ))}
        </View>

        <Text style={styles.label}>Дата</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.buttonConfirm, isSaving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.buttonConfirmText}>
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonEdit} onPress={() => router.back()}>
        <Text style={styles.buttonEditText}>Отмена</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}