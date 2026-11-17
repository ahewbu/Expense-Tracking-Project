import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  createTransaction,
  createCategory,
  updateTransaction,
  normalizeTransactionResult,
} from '../api/transactions';
import { showToast } from '../utils/toast';
import SuggestCategoryModal from './SuggestCategoryModal';
import { colors, radii, text as t } from '../theme/theme';

export default function AddExpenseModal({ visible, onClose, onExpenseAdded }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [suggest, setSuggest] = useState({
    visible: false,
    suggestedName: '',
    transactionId: null,
  });

  const resetForm = () => {
    setAmount('');
    setDescription('');
  };

  const finish = () => {
    resetForm();
    onExpenseAdded?.();
    onClose();
  };

  const handleSubmit = async () => {
    if (!amount || !description) {
      showToast('warning', 'Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      const text = `${description} ${amount} рублей`;
      const raw = await createTransaction(text);
      const { transaction, categoryMatch, suggestedNewCategory } = normalizeTransactionResult(raw);

      if (transaction?.description?.startsWith('[Сбой')) {
        showToast('warning', 'ИИ недоступен. Трата сохранена — проверьте её вручную.');
        resetForm();
        onExpenseAdded?.();
        onClose();
        return;
      }

      if (categoryMatch === 'suggested' && suggestedNewCategory) {
        setSuggest({
          visible: true,
          suggestedName: suggestedNewCategory,
          transactionId: transaction.id,
        });
        return;
      }

      finish();
    } catch (e) {
      console.error('Ошибка добавления траты:', e);
      if (e.response?.status === 400) {
        showToast('error', e.response.data?.detail || 'Не удалось распознать трату');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (name) => {
    setIsLoading(true);
    try {
      const newCat = await createCategory({ name });
      await updateTransaction(suggest.transactionId, { category_id: newCat.id });
      setSuggest({ visible: false, suggestedName: '', transactionId: null });
      finish();
    } catch (e) {
      console.error('Ошибка создания категории:', e);
      if (e.response?.status === 400) {
        const detail = e.response.data?.detail || '';
        if (detail.includes('уже существует')) {
          showToast('warning', 'Такая категория уже есть — введите другое имя');
        } else {
          showToast('error', detail || 'Не удалось создать категорию');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setSuggest({ visible: false, suggestedName: '', transactionId: null });
    resetForm();
    onExpenseAdded?.();
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Новая трата</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Сумма</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Описание</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: кофе в Старбаксе"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Добавить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SuggestCategoryModal
        visible={suggest.visible}
        suggestedName={suggest.suggestedName}
        onConfirm={handleCreateCategory}
        onSkip={handleSkip}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { ...t.h2 },
  closeButton: { padding: 4 },
  field: { marginBottom: 16 },
  label: { ...t.label, marginBottom: 8 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radii.button,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.lavender,
    paddingVertical: 16,
    borderRadius: radii.button,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: 'Ubuntu_500Medium', fontSize: 16, color: '#FFFFFF' },
});