import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { capitalizeFirst } from '../utils/text';

/**
 * Кастомное модальное окно подтверждения (работает и на вебе, и на мобильных).
 */
export default function ConfirmModal({ visible, title, onClose, onConfirm }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>Удалить трату?</Text>
          <Text style={styles.message}>
            Вы уверены, что хотите удалить "{capitalizeFirst(title)}"? 
            Это действие нельзя отменить.
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 12,
  },

  message: {
    fontSize: 14,
    color: '#57534E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F4',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },

  confirmButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  confirmButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});