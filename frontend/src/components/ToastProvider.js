import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { subscribeToast } from '../utils/toast';
import Toast from './Toast';

const MAX_TOASTS = 3;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => {
      setToasts((prev) => {
        const isDuplicate = prev.some((t) => t.message === toast.message);
        if (isDuplicate) return prev;

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
      <View
        style={[
          styles.toastContainer,
          {
            top: Platform.OS === 'web' ? 8 : insets.top + 8,
            position: Platform.OS === 'web' ? 'fixed' : 'absolute',
          },
        ]}
      >
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
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    pointerEvents: 'box-none',
  },
  toastWrapper: {
    width: '90%',
    maxWidth: 400,
  },
});