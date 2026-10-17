import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Alert } from 'react-native';
import { capitalizeFirst } from '../utils/text';

/**
 * Красивое модальное окно с действиями.
 * 
 * Пропсы:
 * - visible: boolean (показывать ли окно)
 * - title: строка (название расхода)
 * - onClose: функция (закрыть окно)
 * - onEdit: функция (редактировать)
 * - onDelete: функция (удалить)
 */
export default function ActionModal({ visible, title, onClose, onEdit, onDelete }) {
  const handleDeletePress = () => {
    Alert.alert(
      'Удалить трату?',
      `Вы уверены, что хотите удалить "${capitalizeFirst(title)}"? Это действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {/* Название расхода */}
          <Text style={styles.title}>{capitalizeFirst(title)}</Text>
          <Text style={styles.subtitle}>Выберите действие</Text>

          {/* Кнопки Редактировать и Удалить в одной строке */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
              <Text style={styles.deleteButtonText}>Удалить</Text>
            </TouchableOpacity>
          </View>

          {/* Кнопка Отмена внизу */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
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