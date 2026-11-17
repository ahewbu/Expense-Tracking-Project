import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, G, Path, Circle } from 'react-native-svg';
import { colors, text as t } from '../theme/theme';

const screenWidth = Dimensions.get('window').width;
const CHART_SIZE = Math.min(screenWidth - 64, 280);
const CENTER_RADIUS = CHART_SIZE * 0.55; // Размер "дырки" donut

/**
 * Преобразует данные в SVG path для donut chart
 */
const createDonutPath = (data, total) => {
  if (total === 0 || data.length === 0) return [];
  
  const cx = CHART_SIZE / 2;
  const cy = CHART_SIZE / 2;
  const outerRadius = CHART_SIZE / 2;
  const innerRadius = CENTER_RADIUS / 2;
  
  let currentAngle = -Math.PI / 2; // Начинаем сверху
  const paths = [];
  
  data.forEach((item) => {
    const angle = (item.amount / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Внешняя дуга
    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);
    
    // Внутренняя дуга
    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);
    
    const largeArc = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    paths.push({
      path: pathData,
      color: item.color,
      name: item.name,
      amount: item.amount,
      percent: ((item.amount / total) * 100).toFixed(1)
    });
    
    currentAngle = endAngle;
  });
  
  return paths;
};

export default function DonutChart({ data, total, centerLabel, centerAmount, changePercent }) {
  const paths = createDonutPath(data, total);
  
  return (
    <View style={styles.container}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        <G>
          {paths.map((item, index) => (
            <Path
              key={index}
              d={item.path}
              fill={item.color}
              stroke={colors.surface}
              strokeWidth={2}
            />
          ))}
        </G>
      </Svg>
      
      {/* Центр с суммой */}
      <View style={styles.center}>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
        <Text style={styles.centerAmount}>{centerAmount}</Text>
        {changePercent !== null && (
          <View style={[styles.changeIndicator, changePercent > 0 ? styles.changeUp : styles.changeDown]}>
            <Text style={[styles.changeText, changePercent > 0 ? styles.changeUpText : styles.changeDownText]}>
              {changePercent > 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    width: CENTER_RADIUS,
    height: CENTER_RADIUS,
    borderRadius: CENTER_RADIUS / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerLabel: { ...t.caption, color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  centerAmount: { ...t.h3, color: colors.text, fontSize: 18, marginBottom: 6 },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  changeUp: { backgroundColor: colors.terracotta + '22' },
  changeDown: { backgroundColor: colors.oliveDeep + '22' },
  changeText: { fontFamily: 'Ubuntu_500Medium', fontSize: 11 },
  changeUpText: { color: colors.terracotta },
  changeDownText: { color: colors.oliveDeep },
});