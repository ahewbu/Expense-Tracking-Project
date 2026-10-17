import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Универсальный блок секции с заголовком и стрелочкой.
 * Используется для "Последние траты", "Категории" и т.д.
 * 
 * Пропсы:
 * - title: строка (заголовок блока)
 * - onArrowPress: функция (что делать при нажатии на стрелку)
 * - children: содержимое блока (список трат и т.д.)
 */
export default function SectionCard({ title, onArrowPress, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onArrowPress && (
          <TouchableOpacity style={styles.arrow} onPress={onArrowPress}>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1917',
  },

  arrow: {
    padding: 4,
  },

  arrowText: {
    fontSize: 20,
    color: '#6366F1',
  },
});