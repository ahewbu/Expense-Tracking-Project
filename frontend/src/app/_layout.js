import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FAFAF9' },
        headerTintColor: '#1C1917',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Мои расходы' }}
      />
      <Stack.Screen 
        name="add-expense" 
        options={{ title: 'Новая трата' }}
      />
    </Stack>
  );
}