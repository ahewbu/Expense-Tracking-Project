import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { createTransaction, updateTransaction, getCategories, createCategory } from '../api/transactions';
import { confirmStyles as styles } from '../styles/confirmStyles';
import CategoryButton from '../components/CategoryButton';
import { sortCategories } from '../utils/categories';

export default function ConfirmScreen() {
  const params = useLocalSearchParams();

  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isParsing, setIsParsing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  
  const parsedRef = useRef(false);

  // 1. Загружаем категории при монтировании
  // 1. Загружаем категории при монтировании (и сортируем)
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(sortCategories(data))) // <-- Сортируем
      .catch((e) => console.error('Ошибка загрузки категорий:', e));
  }, []);
  
  // 2. Парсим текст через ИИ СРАЗУ при открытии экрана (только 1 раз!)
  useEffect(() => {
    if (parsedRef.current) return;
    
    const rawText = params.text || params.description || '';
    if (!rawText.trim()) {
      console.error('Пустой текст для парсинга');
      setIsParsing(false);
      return;
    }

    parsedRef.current = true;

    createTransaction(rawText)
      .then((result) => {
        console.log('ИИ распознал и создал черновик:', result);
        setCurrentTransaction(result);
        setAmount(String(result.amount));
        setDescription(result.description || '');
        setDate(result.transaction_date ? result.transaction_date.split('T')[0] : '');
      })
      .catch((e) => {
        console.error('Ошибка парсинга:', e);
        alert('Не удалось распознать трату');
      })
      .finally(() => setIsParsing(false));
  }, []);

  // 3. Подставляем имя категории, когда всё загрузилось
  useEffect(() => {
    if (currentTransaction && categories.length > 0) {
      const cat = categories.find((c) => c.id === currentTransaction.category_id);
      if (cat) setCategory(cat.name);
    }
  }, [categories, currentTransaction]);

  const validate = () => {
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Ошибка: Сумма должна быть больше 0');
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      alert('Ошибка: Дата не может быть в будущем');
      return false;
    }
    return true;
  };

  const handleSaveEdit = () => {
    if (validate()) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    if (currentTransaction) {
      setAmount(String(currentTransaction.amount));
      setDescription(currentTransaction.description || '');
      setDate(currentTransaction.transaction_date ? currentTransaction.transaction_date.split('T')[0] : '');
      const cat = categories.find((c) => c.id === currentTransaction.category_id);
      if (cat) setCategory(cat.name);
    }
    setIsEditing(false);
  };

  const handleConfirm = async () => {
    if (!validate() || !currentTransaction || isSaving) return;

    setIsSaving(true);
    try {
      let categoryUuid = categories.find((c) => c.name === category)?.id;
      if (!categoryUuid) {
        const newCat = await createCategory({ name: category, icon: '' });
        categoryUuid = newCat.id;
        setCategories((prev) => [...prev, newCat]);
      }

      await updateTransaction(currentTransaction.id, {
        amount: parseFloat(amount),
        category_id: categoryUuid,
        description: description,
        transaction_date: date,
        status: 'confirmed',
      });

      alert('Трата успешно добавлена!');
      router.push('/');
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // Экран загрузки, пока ИИ думает
  if (isParsing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.subtitle}>Распознаём трату...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Проверьте данные</Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Внесите исправления' : 'ИИ распознал вашу трату'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Сумма (₽)</Text>
        {isEditing ? (
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        ) : (
          <Text style={styles.value}>{amount} ₽</Text>
        )}

        <Text style={styles.label}>Категория</Text>
        {isEditing ? (
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
        ) : (
          <Text style={styles.value}>{category}</Text>
        )}

        <Text style={styles.label}>Дата</Text>
        {isEditing ? (
          <TextInput style={styles.input} value={date} onChangeText={setDate} />
        ) : (
          <Text style={styles.value}>{date}</Text>
        )}

        <Text style={styles.label}>Описание</Text>
        {isEditing ? (
          <TextInput style={[styles.input, { minHeight: 60 }]} value={description} onChangeText={setDescription} multiline />
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
          <TouchableOpacity
            style={[styles.buttonConfirm, isSaving && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isSaving}
          >
            <Text style={styles.buttonConfirmText}>
              {isSaving ? 'Сохранение...' : '✓ Подтвердить'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonEdit} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonEditText}> Исправить</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}