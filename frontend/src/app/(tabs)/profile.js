import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getMe, removeToken } from '../../api/auth';
import { showToast } from '../../utils/toast';
import { colors, radii, text as t } from '../../theme/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getMe();
      setUser(data);
    } catch (e) {
      console.error('Ошибка загрузки профиля:', e);
      showToast('error', 'Не удалось загрузить данные профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await removeToken();
      router.replace('/login');
    } catch (e) {
      console.error('Ошибка выхода:', e);
      showToast('error', 'Не удалось выйти из аккаунта');
    }
  };

  // Генерируем инициалы из имени (например, "Иван Иванов" -> "ИИ")
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.lavender} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Шапка с аватаром и данными */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.full_name)}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name || 'Пользователь'}</Text>
        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
      </View>

      {/* Кнопка выхода */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.terracotta} />
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lavenderSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.lavender + '40',
  },
  avatarText: {
    fontFamily: 'Ubuntu_700Bold',
    fontSize: 28,
    color: colors.lavenderDeep,
  },
  name: {
    ...t.h1,
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    ...t.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.terracotta + '40',
    marginTop: 'auto',
    marginBottom: 40,
  },
  logoutText: {
    fontFamily: 'Ubuntu_500Medium',
    fontSize: 16,
    color: colors.terracotta,
  },
});