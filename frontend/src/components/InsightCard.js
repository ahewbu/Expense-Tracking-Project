import { View, Text, Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { colors, gradients, radii, shadows } from '../theme/theme';

/**
 * AI-инсайт с плавной ротацией паттернов.
 * Пропсы:
 * - patterns: массив строк (паттерны из полного анализа)
 * - fallbackText: текст-заглушка, если паттернов нет
 * - onPress: переход к полному анализу
 */
export default function InsightCard({ patterns = [], fallbackText = '', onPress }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Берём паттерны или fallback
  const items = patterns.length > 0 ? patterns : (fallbackText ? [fallbackText] : []);

  // Ротация каждые 6 секунд с плавным fade
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        // Меняем индекс
        setCurrentIndex((prev) => (prev + 1) % items.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [items.length]);

  // Анимация орбов (фоновые переливы)
  const o1 = useRef(new Animated.Value(0)).current;
  const o2 = useRef(new Animated.Value(0)).current;
  const o3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (anim, dur) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    };
    const c1 = drift(o1, 7000);
    const c2 = drift(o2, 9000);
    const c3 = drift(o3, 11000);
    return () => { c1(); c2(); c3(); };
  }, [o1, o2, o3]);

  const t1 = {
    translateX: o1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }),
    translateY: o1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }),
    scale: o1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }),
  };
  const t2 = {
    translateX: o2.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }),
    translateY: o2.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }),
    scale: o2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }),
  };
  const t3 = {
    translateX: o3.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }),
    translateY: o3.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }),
    scale: o3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }),
  };

  const currentText = items[currentIndex] || '';
  const showDots = items.length > 1;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.touchable}>
      <LinearGradient
        colors={gradients.ai}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, shadows.float]}
      >
        {/* Фоновые орбы — ИСПРАВЛЕНО: каждый трансформ в своём объекте */}
        <Animated.View 
          style={[
            styles.orb, 
            styles.orbWhite, 
            { 
              transform: [
                { translateX: t1.translateX },
                { translateY: t1.translateY },
                { scale: t1.scale }
              ] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.orb, 
            styles.orbLav, 
            { 
              transform: [
                { translateX: t2.translateX },
                { translateY: t2.translateY },
                { scale: t2.scale }
              ] 
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.orb, 
            styles.orbPink, 
            { 
              transform: [
                { translateX: t3.translateX },
                { translateY: t3.translateY },
                { scale: t3.scale }
              ] 
            }
          ]} 
        />

        {/* Шапка */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={16} color={colors.white} />
          <Text style={styles.label}>AI INSIGHT</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </View>

        {/* Текст с fade-анимацией */}
        <Animated.View style={{ opacity: fadeAnim, minHeight: 66 }}>
          <Text style={styles.text} numberOfLines={3}>
            {currentText}
          </Text>
        </Animated.View>

        {/* Точки-индикаторы (если паттернов > 1) */}
        {showDots && (
          <View style={styles.dots}>
            {items.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: { borderRadius: radii.card, marginBottom: 16 },
  card: { borderRadius: radii.card, padding: 20, overflow: 'hidden', minHeight: 140 },
  orb: { position: 'absolute', borderRadius: 100 },
  orbWhite: { width: 140, height: 140, top: -50, left: -30, backgroundColor: 'rgba(255,255,255,0.30)' },
  orbLav: { width: 120, height: 120, bottom: -40, right: -20, backgroundColor: 'rgba(238,225,255,0.45)' },
  orbPink: { width: 80, height: 80, top: 30, right: 40, backgroundColor: 'rgba(240,171,252,0.35)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, zIndex: 2 },
  label: { fontFamily: 'Ubuntu_500Medium', fontSize: 11, letterSpacing: 1.6, color: 'rgba(255,255,255,0.9)' },
  text: { fontFamily: 'Ubuntu_400Regular', fontSize: 15, lineHeight: 22, color: colors.white, zIndex: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, zIndex: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: 'rgba(255,255,255,0.9)', width: 16 },
});