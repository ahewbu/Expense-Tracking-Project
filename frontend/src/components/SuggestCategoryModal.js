import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getCategoryStyle } from '../theme/icons';
import { colors, radii, text as t } from '../theme/theme';

export default function SuggestCategoryModal({ visible, suggestedName, onConfirm, onSkip }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) setName(suggestedName || '');
  }, [visible, suggestedName]);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && !/[<>'";]/.test(trimmed);
  const iconStyle = getCategoryStyle(trimmed || suggestedName);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Иконка категории с цветным фоном */}
          <View style={[styles.iconWrap, { backgroundColor: iconStyle.color + '22' }]}>
            <Ionicons name={iconStyle.icon} size={28} color={iconStyle.color} />
          </View>

          <Text style={styles.title}>Категория не нашлась</Text>
          <Text style={styles.subtitle}>
            ИИ сохранил трату в «Прочее». Создать новую категорию?
          </Text>

          <TextInput
            style={[styles.input, !isValid && trimmed.length > 0 && styles.inputInvalid]}
            value={name}
            onChangeText={setName}
            placeholder="Название категории"
            placeholderTextColor={colors.textMuted}
            maxLength={100}
            autoCapitalize="words"
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipText}>В «Прочее»</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, !isValid && styles.createButtonDisabled]}
              onPress={() => onConfirm(trimmed)}
              disabled={!isValid}
            >
              <Text style={styles.createText}>Создать</Text>
            </TouchableOpacity>
          </View>
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
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...t.h2,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    ...t.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Ubuntu_400Regular',
    color: colors.text,
    marginBottom: 20,
  },
  inputInvalid: {
    borderColor: colors.terracotta,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Ubuntu_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    backgroundColor: colors.lavender,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createText: {
    fontFamily: 'Ubuntu_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});