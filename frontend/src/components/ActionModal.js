import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { capitalizeFirst } from '../utils/text';
import ConfirmModal from './ConfirmModal';
import { useState } from 'react';

/**
 * Модальное окно с действиями (Редактировать, Удалить, Отмена).
 * Теперь использует кастомное окно подтверждения вместо Alert.
 */
export default function ActionModal({ visible, title, onClose, onEdit, onDelete }) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleDeletePress = () => {
    // Открываем кастомное окно подтверждения
    setConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    setConfirmVisible(false);
    onDelete(); // Вызываем удаление
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.container}>
            <Text style={styles.title}>{capitalizeFirst(title)}</Text>
            <Text style={styles.subtitle}>Выберите действие</Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                <Text style={styles.editButtonText}>Редактировать</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Кастомное окно подтверждения удаления */}
      <ConfirmModal
        visible={confirmVisible}
        title={title}
        onClose={() => setConfirmVisible(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#A8A29E',
    textAlign: 'center',
    marginBottom: 24,
  },

  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  editButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  editButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    backgroundColor: '#F5F5F4',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  cancelButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});