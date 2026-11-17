import { View, StyleSheet, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { subscribeToast } from '../utils/toast';
import Toast from './Toast';

const MAX_TOASTS = 3; // Максимум тостов на экране одновременно

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => {
      setToasts((prev) => {
        // Если уже есть тост с таким же текстом — не дублируем
        const isDuplicate = prev.some((t) => t.message === toast.message);
        if (isDuplicate) return prev;

        // Ограничиваем очередь: удаляем самые старые, если больше MAX_TOASTS
        const next = [...prev, toast];
        if (next.length > MAX_TOASTS) {
          return next.slice(-MAX_TOASTS);
        }
        return next;
      });
    });
    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <View style={styles.wrapper}>
      {children}
      <View style={styles.toastContainer}>
        {toasts.map((toast, index) => (
          <View key={toast.id} style={[styles.toastWrapper, { marginTop: index > 0 ? 8 : 0 }]}>
            <Toast toast={toast} onDone={removeToast} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastWrapper: {
    width: '90%',
    maxWidth: 400,
  },
});