/**
 * Глобальный менеджер тостов.
 * Работает вне React-дерева (вызывается из axios-интерцептора).
 */

const listeners = new Set();

export const showToast = (type, message, duration = 4000) => {
  const payload = {
    id: Date.now() + Math.random(),
    type,    // 'success' | 'error' | 'warning' | 'info'
    message,
    duration,
  };
  listeners.forEach((fn) => fn(payload));
};

export const subscribeToast = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};