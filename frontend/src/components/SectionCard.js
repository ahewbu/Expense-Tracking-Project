import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // <-- ИСПРАВЛЕНО: встроенная библиотека Expo
import { colors, radii, shadows, text as t } from '../theme/theme';

export default function SectionCard({ title, actionLabel, onArrowPress, children }) {
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onArrowPress && (
          <TouchableOpacity style={styles.action} onPress={onArrowPress}>
            <Text style={styles.actionText}>{actionLabel || 'Все'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.lavenderDeep} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { ...t.label, color: colors.textSecondary },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: {
    fontFamily: 'Ubuntu_500Medium',
    fontSize: 13,
    color: colors.lavenderDeep,
  },
});