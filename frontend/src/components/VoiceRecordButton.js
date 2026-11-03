import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { sendVoiceTransaction } from '../api/transactions';

/**
 * Круглая кнопка голосового ввода.
 * 1 клик — запись | клик мимо — отмена | 2 клик по кружку — обработка и сохранение.
 */
export default function VoiceRecordButton({ onResult, disabled }) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
      pulseAnim.setValue(1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatDuration = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const start = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нет доступа', 'Разреши доступ к микрофону в настройках');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (e) {
      console.error('Ошибка старта записи:', e);
      Alert.alert('Ошибка', 'Не удалось начать запись');
    }
  };

  const stopAndSend = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) throw new Error('Пустой URI записи');
      const transaction = await sendVoiceTransaction(uri);
      onResult?.(transaction);
    } catch (e) {
      console.error('Ошибка голосового ввода:', e);
      Alert.alert('Ошибка', 'Не удалось распознать речь. Попробуй ещё раз или введи текстом.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Отмена: просто останавливаем запись, НИЧЕГО не отправляем
  const cancel = async () => {
    try {
      setIsRecording(false);
      await audioRecorder.stop();
    } catch (e) {
      console.error('Ошибка отмены записи:', e);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Прозрачный оверлей на весь экран: клик мимо = отмена */}
      {isRecording && (
        <TouchableOpacity style={styles.cancelOverlay} activeOpacity={1} onPress={cancel} />
      )}

      <TouchableOpacity
        style={[
          styles.micButton,
          isRecording && styles.micButtonRecording,
          (disabled || isProcessing) && styles.micButtonDisabled,
        ]}
        onPress={isRecording ? stopAndSend : start}
        disabled={disabled || isProcessing}
        activeOpacity={0.85}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={26} color="#FFFFFF" />
          </Animated.View>
        )}
      </TouchableOpacity>

      <Text style={styles.timerText}>
        {isProcessing ? 'Распознаём...' : isRecording ? formatDuration(duration) : 'Голосом'}
      </Text>
      {isRecording && <Text style={styles.hintText}>Клик мимо — отмена</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6 },
  cancelOverlay: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 10,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  micButtonRecording: { backgroundColor: '#EF4444' },
  micButtonDisabled: { opacity: 0.6 },
  timerText: { fontSize: 12, color: '#A8A29E', fontWeight: '500' },
  hintText: { fontSize: 11, color: '#EF4444' },
});