import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, text as t } from '../theme/theme';

export default function ScrollableLegend({ data, total }) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {data.map((item, index) => {
        const percent = total > 0 ? ((item.amount / total) * 100).toFixed(1) : 0;
        return (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.percent}>{percent}%</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    ...t.caption,
    color: colors.textMuted,
    maxWidth: 80,
  },
  percent: {
    ...t.caption,
    color: colors.text,
    fontWeight: '600',
  },
});