import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * Компонент кнопки выбора категории.
 * 
 * Пропсы:
 * - name: строка (название категории)
 * - isActive: boolean (выбрана ли категория)
 * - onPress: функция (обработчик нажатия)
 */
export default function CategoryButton({ name, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.buttonActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, isActive && styles.textActive]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },

  buttonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },

  text: {
    fontSize: 14,
    color: '#57534E',
  },

  textActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
});