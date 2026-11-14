import { View, Text, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { colors, gradients, radii, shadows } from '../theme/theme';

export default function InsightCard({ text }) {
  const o1 = useRef(new Animated.Value(0)).current;
  const o2 = useRef(new Animated.Value(0)).current;
  const o3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (anim, dx, dy, dur) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    };
    const c1 = drift(o1, 40, -30, 7000);
    const c2 = drift(o2, -50, 40, 9000);
    const c3 = drift(o3, 30, 50, 11000);
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

  return (
    <LinearGradient
      colors={gradients.ai}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.float]}
    >
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

      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={colors.white} />
        <Text style={styles.label}>AI INSIGHT</Text>
      </View>

      <Text style={styles.text} numberOfLines={3}>
        {text}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, padding: 20, marginBottom: 16, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 100 },
  orbWhite: {
    width: 140, height: 140, top: -50, left: -30,
    backgroundColor: 'rgba(111, 63, 189, 0.3)',
    ...(Platform.OS === 'web' ? { filter: 'blur(28px)' } : null),
  },
  orbLav: {
    width: 120, height: 120, bottom: -40, right: -20,
    backgroundColor: 'rgba(235, 225, 255, 0.45)',
    ...(Platform.OS === 'web' ? { filter: 'blur(24px)' } : null),
  },
  orbPink: {
    width: 80, height: 80, top: 30, right: 40,
    backgroundColor: 'rgba(240,171,252,0.35)',
    ...(Platform.OS === 'web' ? { filter: 'blur(20px)' } : null),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, zIndex: 2 },
  label: { fontFamily: 'Ubuntu_500Medium', fontSize: 11, letterSpacing: 1.6, color: 'rgba(255,255,255,0.9)' },
  text: { fontFamily: 'Ubuntu_400Regular', fontSize: 15, lineHeight: 22, color: colors.white, zIndex: 2 },
});