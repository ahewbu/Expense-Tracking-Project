import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/transactions';
import { CATEGORY_STYLES } from '../../theme/icons';
import { showToast } from '../../utils/toast';
import { sortCategories } from '../../utils/categories';
import { colors, radii, text as t } from '../../theme/theme';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Мини-меню (редактировать/удалить)
  const [contextMenu, setContextMenu] = useState({ visible: false, category: null });

  // Модалка редактирования
  const [editModal, setEditModal] = useState({
    visible: false,
    categoryId: null,
    name: '',
    iconName: 'cube-outline',
  });

  // Модалка подтверждения удаления
  const [deleteModal, setDeleteModal] = useState({ visible: false, category: null });

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

  // === Добавление категории ===
  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('warning', 'Введите название категории');
      return;
    }
    if (/[<>'";]/.test(trimmed)) {
      showToast('error', 'Название содержит недопустимые символы');
      return;
    }
    try {
      await createCategory({ name: trimmed, icon: '' });
      setNewCategoryName('');
      setAddModalVisible(false);
      await loadCategories();
    } catch (e) {
      const detail = e.response?.data?.detail || '';
      if (detail.includes('уже существует')) {
        showToast('warning', 'Такая категория уже есть');
      } else {
        showToast('error', 'Не удалось создать категорию');
      }
    }
  };

  // === Долгое нажатие → показать мини-меню ===
  const handleLongPress = (category) => {
    setContextMenu({ visible: true, category });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, category: null });
  };

  // === Редактирование ===
  const openEditModal = () => {
    const cat = contextMenu.category;
    if (!cat) return;
    const style = CATEGORY_STYLES[cat.name] || { icon: 'cube-outline' };
    setEditModal({
      visible: true,
      categoryId: cat.id,
      name: cat.name,
      iconName: style.icon,
    });
    closeContextMenu();
  };

  const saveEdit = async () => {
    const trimmed = editModal.name.trim();
    if (!trimmed) {
      showToast('warning', 'Название не может быть пустым');
      return;
    }
    if (/[<>'";]/.test(trimmed)) {
      showToast('error', 'Название содержит недопустимые символы');
      return;
    }
    try {
      await updateCategory(editModal.categoryId, {
        name: trimmed,
        icon: editModal.iconName,
      });
      setEditModal({ visible: false, categoryId: null, name: '', iconName: 'cube-outline' });
      await loadCategories();
    } catch (e) {
      const detail = e.response?.data?.detail || '';
      if (detail.includes('уже существует')) {
        showToast('warning', 'Такая категория уже есть');
      } else {
        showToast('error', 'Не удалось сохранить изменения');
      }
    }
  };

  // === Удаление ===
  const openDeleteModal = () => {
    setDeleteModal({ visible: true, category: contextMenu.category });
    closeContextMenu();
  };

  const confirmDelete = async () => {
    if (!deleteModal.category) return;
    try {
      await deleteCategory(deleteModal.category.id);
      setDeleteModal({ visible: false, category: null });
      await loadCategories();
    } catch (e) {
      console.error('Ошибка удаления категории:', e);
      showToast('error', 'Не удалось удалить категорию');
    }
  };

  // === Рендер категории ===
  const renderCategory = ({ item }) => {
    // 1. Берем базовый стиль из нашего надежного маппинга
    const style = CATEGORY_STYLES[item.name] || { icon: 'cube-outline', color: '#9CA3AF' };
    
    // 2. Проверяем, является ли item.icon валидным именем Ionicons (а не эмодзи из старой БД)
    // Валидные имена иконок состоят только из латинских букв, цифр и дефисов (например, "fast-food")
    const isValidIonicon = item.icon && /^[a-z0-9\-]+$/.test(item.icon);
    
    // 3. Используем иконку из БД только если она валидна, иначе берем из маппинга
    const iconName = isValidIonicon ? item.icon : style.icon;

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: style.color + '22' }]}>
          <Ionicons name={iconName} size={20} color={style.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.title}>Категории</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Список */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Пока нет категорий</Text>}
      />

      {/* === Мини-меню (редактировать/удалить) === */}
      <Modal visible={contextMenu.visible} transparent animationType="fade" onRequestClose={closeContextMenu}>
        <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={closeContextMenu}>
          <View style={styles.contextMenu}>
            <TouchableOpacity style={styles.contextItem} onPress={openEditModal}>
              <Ionicons name="pencil" size={18} color={colors.text} />
              <Text style={styles.contextText}>Редактировать</Text>
            </TouchableOpacity>
            <View style={styles.contextDivider} />
            <TouchableOpacity style={styles.contextItem} onPress={openDeleteModal}>
              <Ionicons name="trash" size={18} color={colors.terracotta} />
              <Text style={[styles.contextText, { color: colors.terracotta }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* === Модалка редактирования === */}
      <Modal visible={editModal.visible} transparent animationType="slide" onRequestClose={() => setEditModal({ ...editModal, visible: false })}>
        <View style={styles.editOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Редактировать</Text>

            <TextInput
              style={styles.editInput}
              value={editModal.name}
              onChangeText={(name) => setEditModal({ ...editModal, name })}
              placeholder="Название"
              maxLength={100}
            />

            <Text style={styles.iconLabel}>Иконка</Text>
            <FlatList
              data={Object.entries(CATEGORY_STYLES)}
              numColumns={5}
              keyExtractor={([name]) => name}
              renderItem={({ item: [catName, catStyle] }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    editModal.iconName === catStyle.icon && styles.iconOptionActive,
                  ]}
                  onPress={() => setEditModal({ ...editModal, iconName: catStyle.icon })}
                >
                  <Ionicons
                    name={catStyle.icon}
                    size={22}
                    color={editModal.iconName === catStyle.icon ? colors.lavender : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
              style={styles.iconGrid}
            />

            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModal({ ...editModal, visible: false })}>
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                <Text style={styles.saveText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* === Модалка подтверждения удаления === */}
      <Modal visible={deleteModal.visible} transparent animationType="fade" onRequestClose={() => setDeleteModal({ visible: false, category: null })}>
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Ionicons name="trash" size={32} color={colors.terracotta} />
            <Text style={styles.deleteTitle}>Удалить категорию?</Text>
            <Text style={styles.deleteSubtitle}>{deleteModal.category?.name}</Text>
            <Text style={styles.deleteWarning}>
              Все траты будут перенесены в «Прочее»
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModal({ visible: false, category: null })}>
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* === Модалка добавления === */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.editOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Новая категория</Text>
            <TextInput
              style={styles.editInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Название"
              autoFocus
              maxLength={100}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setAddModalVisible(false); setNewCategoryName(''); }}>
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
                <Text style={styles.saveText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: { ...t.h1 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: '600', lineHeight: 28 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  empty: { ...t.body, color: colors.textMuted, textAlign: 'center', paddingVertical: 40 },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: { flex: 1 },
  categoryName: { ...t.body },

  contextOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  contextMenu: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: 8,
    width: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  contextText: { ...t.body },
  contextDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },

  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: 24,
    paddingBottom: 32,
  },
  editTitle: { ...t.h2, marginBottom: 20 },
  editInput: {
    backgroundColor: colors.bg,
    borderRadius: radii.button,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  iconLabel: { ...t.label, marginBottom: 12 },
  iconGrid: { maxHeight: 200, marginBottom: 20 },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionActive: {
    borderColor: colors.lavender,
    backgroundColor: colors.lavenderSoft,
  },
  editButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: colors.textSecondary },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.lavender,
    alignItems: 'center',
  },
  saveText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: '#FFFFFF' },

  deleteOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
  deleteModal: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  deleteTitle: { ...t.h2, marginTop: 12, marginBottom: 4 },
  deleteSubtitle: { ...t.body, color: colors.textMuted, marginBottom: 20 },
  deleteButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
  },
  deleteButtonText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: '#FFFFFF' },
});