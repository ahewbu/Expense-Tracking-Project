import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getToken } from '../api/auth';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем наличие токена при загрузке приложения
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        // Токена нет — перенаправляем на логин
        router.replace('/login');
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      router.replace('/login');
    } finally {
      setIsReady(true);
    }
  };

  // Пока проверяем авторизацию — показываем пустой экран
  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="add-expense" />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="edit-expense" />
      </Stack>
    </SafeAreaProvider>
  );
}