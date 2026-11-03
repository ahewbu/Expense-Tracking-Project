import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { createTransaction } from '../api/transactions';

/**
 * Модальное окно добавления траты поверх главного экрана.
 * Фон затемняется (на вебе ещё и блюрится), карточка появляется по центру.
 */
export default function AddExpenseModal({ visible, onClose, onExpenseAdded }) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setText('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return; // не закрываем во время отправки
    reset();
    onClose();
  };

  const handleAdd = async () => {
    if (!text.trim()) {
      setError('Введите описание траты');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await createTransaction(text.trim());
      reset();
      onExpenseAdded?.();
      onClose();
    } catch (e) {
      console.error('Ошибка добавления:', e);
      setError(e.response?.data?.detail || 'Не удалось добавить трату. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Затемнённый фон (на вебе — с блюром). Клик по фону закрывает окно */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Карточка поверх фона */}
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Новая трата</Text>
            <TouchableOpacity onPress={handleClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color="#A8A29E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Опиши трату своими словами — ИИ распознает сумму и категорию
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Например: кофе за 250 рублей"
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClose} disabled={isLoading}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>

            {/* Круглая кнопка с галочкой вместо большой кнопки */}
            <TouchableOpacity
              style={[styles.checkButton, isLoading && styles.checkButtonDisabled]}
              onPress={handleAdd}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 25, 23, 0.55)', // затемнение
    // Блюр работает в веб-версии
    ...(Platform.OS === 'web'
      ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }
      : null),
  },
  card: {
    width: '88%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1917',
  },
  subtitle: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 6,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  cancelText: {
    fontSize: 15,
    color: '#A8A29E',
    fontWeight: '500',
  },
  checkButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  checkButtonDisabled: {
    opacity: 0.7,
  },
});