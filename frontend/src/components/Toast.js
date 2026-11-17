import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { colors, radii, text as t } from '../theme/theme';

// Стили для каждого типа тоста
const TYPE_STYLES = {
  success: {
    bg: ['#D9E096', '#A3B84A'],   // оливковый градиент
    icon: 'checkmark-circle',
    iconColor: '#FFFFFF',
  },
  error: {
    bg: ['#E8A0A0', '#D4736A'],   // терракотовый
    icon: 'alert-circle',
    iconColor: '#FFFFFF',
  },
  warning: {
    bg: ['#E8C9A0', '#D9A05B'],   // песочный
    icon: 'time',
    iconColor: '#FFFFFF',
  },
  info: {
    bg: ['#C6B4E9', '#A78BFA'],   // лавандовый
    icon: 'information-circle',
    iconColor: '#FFFFFF',
  },
};

export default function Toast({ toast, onDone }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  useEffect(() => {
    // Появление
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Исчезновение
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDone?.(toast.id);
      });
    }, toast.duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: style.bg[0],
        },
      ]}
    >
      <Ionicons name={style.icon} size={22} color={style.iconColor} />
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radii.button,
    width: '100%',  // <-- добавлено
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    fontFamily: 'Ubuntu_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
});