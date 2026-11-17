import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryStyle } from '../theme/icons';

/**
 * Компонент кнопки выбора категории с иконкой.
 */
export default function CategoryButton({ name, isActive, onPress }) {
  const style = getCategoryStyle(name);

  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.buttonActive]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Ionicons
          name={style.icon}
          size={16}
          color={isActive ? colors.lavenderDeep : colors.textMuted}
          style={styles.icon}
        />
        <Text style={[styles.text, isActive && styles.textActive]}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const colors = {
  lavenderDeep: '#6366F1',
  textMuted: '#A8A29E',
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  buttonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.lavenderDeep,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: { marginRight: 2 },
  text: {
    fontSize: 14,
    color: colors.textMuted,
  },
  textActive: {
    color: colors.lavenderDeep,
    fontWeight: '600',
  },
});