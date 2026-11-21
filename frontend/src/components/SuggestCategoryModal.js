import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { colors, radii, text as t } from '../theme/theme';

const AVAILABLE_ICONS = [
  'cart', 'fast-food', 'car', 'home', 'wifi',
  'medkit', 'shield-checkmark', 'game-controller', 'shirt', 'sparkles',
  'laptop', 'hammer', 'school', 'airplane', 'bicycle',
  'gift', 'happy', 'paw', 'card', 'cube-outline',
  'cafe', 'restaurant', 'bus', 'train', 'fitness',
  'musical-notes', 'film', 'book', 'briefcase', 'heart',
  'star', 'flash', 'leaf', 'water', 'pizza',
];

const AVAILABLE_COLORS = [
  '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#06B6D4',
  '#EF4444', '#6366F1', '#EC4899', '#F97316', '#D946EF',
  '#64748B', '#78716C', '#2563EB', '#0EA5E9', '#84CC16',
  '#F43F5E', '#FBBF24', '#A78BFA', '#14B8A6', '#9CA3AF',
];

export default function SuggestCategoryModal({
  visible,
  suggestedName,
  categories = [],
  onConfirm,
  onLink,
  onSkip,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('cube-outline');
  const [selectedColor, setSelectedColor] = useState('#9CA3AF');

  useEffect(() => {
    if (visible) {
      setName(suggestedName || '');
      setError('');
      setBusy(false);
      setShowIconPicker(false);
      setSelectedIcon('cube-outline');
      setSelectedColor('#9CA3AF');
    }
  }, [visible, suggestedName]);

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0 && !/[<>'";]/.test(trimmed);

  const handleCreateClick = () => {
    if (busy) return;
    if (!trimmed) { setError('Введите название'); return; }
    if (/[<>'";]/.test(trimmed)) { setError('Недопустимые символы'); return; }
    
    const exists = categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError('Такая категория уже есть');
      return;
    }
    
    setError('');
    setShowIconPicker(true);
  };

  const handleConfirmWithIcon = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm(trimmed, selectedIcon, selectedColor);
      setShowIconPicker(false);
    } catch (e) {
      setError(e.message || 'Не удалось создать категорию');
      setBusy(false);
    }
  };

  const handleLink = async (cat) => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await onLink(cat);
    } catch (e) {
      setError(e.message || 'Не удалось привязать');
      setBusy(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.name !== 'Прочее');

  // === ЭКРАН ВЫБОРА ИКОНКИ И ЦВЕТА ===
  if (showIconPicker) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setShowIconPicker(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.modal}>
              <Ionicons name="sparkles" size={26} color={colors.lavenderDeep} />
              <Text style={styles.title}>Выберите иконку и цвет</Text>
              <Text style={styles.subtitle}>Для категории «{trimmed}»</Text>

              {/* Превью */}
              <View style={[styles.previewWrap, { backgroundColor: selectedColor + '22' }]}>
                <Ionicons name={selectedIcon} size={36} color={selectedColor} />
              </View>

              {/* Сетка иконок */}
              <Text style={styles.sectionLabel}>Иконка</Text>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconOption,
                      selectedIcon === iconName && { borderColor: selectedColor, backgroundColor: selectedColor + '22' },
                    ]}
                    onPress={() => setSelectedIcon(iconName)}
                  >
                    <Ionicons 
                      name={iconName} 
                      size={22} 
                      color={selectedIcon === iconName ? selectedColor : colors.textMuted} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Палитра цветов */}
              <Text style={styles.sectionLabel}>Цвет</Text>
              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.pickerButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowIconPicker(false)}
                  disabled={busy}
                >
                  <Text style={styles.cancelText}>Назад</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, busy && styles.confirmButtonDisabled]}
                  onPress={handleConfirmWithIcon}
                  disabled={busy}
                >
                  <Text style={styles.confirmText}>{busy ? '…' : 'Создать'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // === ОСНОВНОЙ ЭКРАН ВВОДА НАЗВАНИЯ ===
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Ionicons name="sparkles" size={26} color={colors.lavenderDeep} />
          <Text style={styles.title}>Категория не нашлась</Text>
          <Text style={styles.subtitle}>Трата пока в «Прочее». Создайте новую или выберите существующую.</Text>

          <View style={styles.createRow}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={name}
              onChangeText={(v) => { setName(v); if (error) setError(''); }}
              placeholder="Название категории"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
              autoCapitalize="words"
              editable={!busy}
            />
            <TouchableOpacity
              style={[styles.createButton, (!canCreate || busy) && styles.createButtonDisabled]}
              onPress={handleCreateClick}
              disabled={!canCreate || busy}
            >
              <Text style={styles.createText}>{busy ? '…' : 'Создать'}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {filteredCategories.length > 0 && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>или выберите</Text>
                <View style={styles.divider} />
              </View>

              <ScrollView style={styles.catList} keyboardShouldPersistTaps="handled">
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.catItem}
                    onPress={() => handleLink(cat)}
                    disabled={busy}
                  >
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <TouchableOpacity style={styles.skipButton} onPress={onSkip} disabled={busy}>
            <Text style={styles.skipText}>Оставить в «Прочее»</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    maxHeight: '90%',
  },
  title: { ...t.h2, marginTop: 10, marginBottom: 4, textAlign: 'center' },
  subtitle: {
    ...t.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  createRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 4 },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Ubuntu_400Regular',
    color: colors.text,
  },
  inputError: { borderColor: colors.terracotta },
  errorText: {
    fontFamily: 'Ubuntu_400Regular',
    fontSize: 12,
    color: colors.terracotta,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  createButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radii.button,
    backgroundColor: colors.lavender,
  },
  createButtonDisabled: { opacity: 0.5 },
  createText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: '#FFFFFF' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginVertical: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: 'Ubuntu_400Regular', fontSize: 12, color: colors.textMuted },
  catList: { width: '100%', maxHeight: 170, marginBottom: 12 },
  catItem: {
    paddingVertical: 10,
  },
  catName: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: colors.text },
  skipButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: colors.textSecondary },

  previewWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'Ubuntu_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text,
    transform: [{ scale: 1.1 }],
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: colors.textSecondary },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.lavender,
    alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { fontFamily: 'Ubuntu_500Medium', fontSize: 14, color: '#FFFFFF' },
});