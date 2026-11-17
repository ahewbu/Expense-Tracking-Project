import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ubuntu_400Regular, Ubuntu_500Medium, Ubuntu_700Bold } from '@expo-google-fonts/ubuntu';
import { getToken } from '../api/auth';
import ToastProvider from '../components/ToastProvider';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Ubuntu_400Regular,
    Ubuntu_500Medium,
    Ubuntu_700Bold,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (!token) router.replace('/login');
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      router.replace('/login');
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="confirm" />
          <Stack.Screen name="edit-expense" />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}