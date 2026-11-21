import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  createTransaction,
  createCategory,
  updateTransaction,
  getCategories,
  normalizeTransactionResult,
} from '../api/transactions';
import { showToast } from '../utils/toast';
import SuggestCategoryModal from './SuggestCategoryModal';
import { colors, radii, text as t } from '../theme/theme';

export default function AddExpenseModal({ visible, onClose, onExpenseAdded }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [suggest, setSuggest] = useState({ visible: false, suggestedName: '', transactionId: null });
  const [suggestCategories, setSuggestCategories] = useState([]);

  const resetForm = () => { setAmount(''); setDescription(''); };

  const finish = () => {
    resetForm();
    onExpenseAdded?.();
    onClose();
  };

  const openSuggest = async (transactionId, suggestedName) => {
    setSuggest({ visible: true, suggestedName, transactionId });
    // Грузим категории с сортировкой: по алфавиту, «Прочее» — в конце
    try {
      const cats = await getCategories();
      const sorted = (cats || []).sort((a, b) => {
        if (a.name === 'Прочее') return 1;
        if (b.name === 'Прочее') return -1;
        return a.name.localeCompare(b.name, 'ru');
      });
      setSuggestCategories(sorted);
    } catch (e) {
      setSuggestCategories([]);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!amount || !description) {
      showToast('warning', 'Заполните все поля');
      return;
    }
    if (/[<>'";]/.test(description)) {
      showToast('error', 'Описание содержит недопустимые символы');
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
        await openSuggest(transaction.id, suggestedNewCategory);
        return; // основную модалку НЕ закрываем
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

  // Бросаем Error — модалка покажет его инлайн (тост под модалкой не видно!)
  const handleCreateCategory = async (name, icon, color) => {
    setIsLoading(true);
    try {
      const newCat = await createCategory({ name, icon, color });
      await updateTransaction(suggest.transactionId, { category_id: newCat.id });
      setSuggest({ visible: false, suggestedName: '', transactionId: null });
      finish();
    } catch (e) {
      const detail = e.response?.data?.detail || '';
      if (detail.includes('уже существует')) throw new Error('Такая категория уже есть');
      if (!e.response) throw new Error('Нет связи с сервером');
      throw new Error(detail || 'Не удалось создать категорию');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkCategory = async (cat) => {
    try {
      await updateTransaction(suggest.transactionId, { category_id: cat.id });
      setSuggest({ visible: false, suggestedName: '', transactionId: null });
      finish();
    } catch (e) {
      if (!e.response) throw new Error('Нет связи с сервером');
      throw new Error('Не удалось привязать категорию');
    }
  };

  const handleSkip = () => {
    setSuggest({ visible: false, suggestedName: '', transactionId: null });
    finish();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.overlay}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SuggestCategoryModal
        visible={suggest.visible}
        suggestedName={suggest.suggestedName}
        categories={suggestCategories}
        onConfirm={handleCreateCategory}
        onLink={handleLinkCategory}
        onSkip={handleSkip}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: 24,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
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