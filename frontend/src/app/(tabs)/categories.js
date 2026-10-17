import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useState, useCallback } from 'react';
import { getCategories, createCategory } from '../../api/transactions';
import { categoriesStyles as styles } from '../../styles/categoriesStyles';
import { getCategoryColor } from '../../utils/categoryColors';
import { sortCategories } from '../../utils/categories';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      const sorted = sortCategories(data);
      setCategories(sorted);
    } catch (e) {
      console.error('Ошибка загрузки категорий:', e);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Ошибка', 'Введите название категории');
      return;
    }

    try {
      await createCategory({
        name: newCategoryName.trim(),
        icon: '',
      });
      
      Alert.alert('Успех', 'Категория добавлена!');
      setNewCategoryName('');
      setModalVisible(false);
      await loadCategories(); // Перезагружаем список
    } catch (e) {
      console.error('Ошибка создания категории:', e);
      Alert.alert('Ошибка', 'Не удалось создать категорию');
    }
  };

  return (
    <View style={styles.container}>
      {/* Заголовок с кнопкой добавления */}
      <View style={styles.header}>
        <Text style={styles.title}>Категории</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Список категорий */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const color = getCategoryColor(item.name);
          return (
            <View style={styles.categoryCard}>
              {/* Цветная полоска слева */}
              <View style={[styles.categoryColorBar, { backgroundColor: color }]} />
              
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{item.name}</Text>
              </View>
              
              {item.icon ? (
                <Text style={styles.categoryIcon}>{item.icon}</Text>
              ) : (
                <Text style={styles.categoryIcon}></Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>Пока нет категорий</Text>
        }
      />

      {/* Модальное окно добавления категории */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новая категория</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Название категории"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
                <Text style={styles.saveButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}