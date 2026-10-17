import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Нижний таб-бар с навигацией.
 * Адаптивный — учитывает нижнюю панель Android/iOS.
 */
export default function TabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets(); // <-- Получаем отступы для безопасной зоны

  const tabs = [
    { name: 'Домашняя', icon: '🏠', route: '/' },
    { name: 'Категории', icon: '📂', route: '/categories' },
    { name: 'Анализ', icon: '📊', route: '/analytics' },
    { name: 'Профиль', icon: '🙉', route: '/profile' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.route)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    paddingTop: 8,  // Было 12
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,  // Уменьшаем
  },

  icon: {
    fontSize: 20,  // Было 24
    marginBottom: 2,  // Было 4
    opacity: 0.5,
  },

  iconActive: {
    opacity: 1,
  },

  label: {
    fontSize: 10,  // Было 12
    color: '#A8A29E',
  },

  labelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
});