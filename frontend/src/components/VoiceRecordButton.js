import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import {
  sendVoiceTransaction,
  createCategory,
  updateTransaction,
  getCategories,
  normalizeTransactionResult,
} from '../api/transactions';
import { showToast } from '../utils/toast';
import SuggestCategoryModal from './SuggestCategoryModal';
import { colors, gradients, shadows } from '../theme/theme';

export default function VoiceRecordButton({ onResult, disabled }) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);

  const [suggest, setSuggest] = useState({ visible: false, suggestedName: '', transactionId: null });
  const [suggestCategories, setSuggestCategories] = useState([]);

  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      const makeRing = (anim, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
              Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ]),
          ])
        );

      Animated.timing(btnScale, { toValue: 1.15, duration: 300, useNativeDriver: true }).start();

      const r1 = makeRing(ring1, 0);
      const r2 = makeRing(ring2, 900);
      r1.start();
      r2.start();

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        r1.stop();
        r2.stop();
        ring1.setValue(1);
        ring2.setValue(1);
        Animated.timing(btnScale, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      };
    }
  }, [isRecording]);

  const formatDuration = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const start = async () => {
    setDuration(0);
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== 'granted') {
        showToast('warning', 'Разреши доступ к микрофону в настройках');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (e) {
      console.error('Ошибка старта записи:', e);
      showToast('error', 'Не удалось начать запись');
    }
  };

  const stopAndSend = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) throw new Error('Пустой URI записи');

      const raw = await sendVoiceTransaction(uri);
      const { transaction, categoryMatch, suggestedNewCategory } = normalizeTransactionResult(raw);

      // Сбой ИИ
      if (transaction?.description?.startsWith('[Сбой')) {
        showToast('warning', 'ИИ недоступен. Трата сохранена — проверьте её вручную.');
        onResult?.(transaction);
        return;
      }

      // ИИ предложил новую категорию
      // ИИ предложил новую категорию
      if (categoryMatch === 'suggested' && suggestedNewCategory) {
        setSuggest({
          visible: true,
          suggestedName: suggestedNewCategory,
          transactionId: transaction.id,
        });
        // Загружаем категории с сортировкой: по алфавиту, «Прочее» — в конце
        try {
          const cats = await getCategories();
          const sorted = (cats || []).sort((a, b) => {
            if (a.name === 'Прочее') return 1;
            if (b.name === 'Прочее') return -1;
            return a.name.localeCompare(b.name, 'ru');
          });
          setSuggestCategories(sorted);
        } catch (e) {
          setSuggestCategories([]);
        }
        return;
      }

      // Обычный сценарий
      onResult?.(transaction);
    } catch (e) {
      console.error('❌ Ошибка голосового ввода:', e);
      // Если это таймаут или сетевая ошибка — интерцептор уже показал тост
      if (!e.response) {
        const isTimeout =
          e.code === 'ECONNABORTED' ||
          /timeout/i.test(e.message || '') ||
          e.message?.includes('90000');
        if (!isTimeout) {
          // Только реальная сетевая ошибка (не таймаут) — показываем свой тост
          showToast('error', 'Не удалось распознать речь. Попробуйте ещё раз.');
        }
        return;
      }
      // Настоящая ошибка сервера (4xx/5xx)
      showToast('error', e.response?.data?.detail || 'Не удалось распознать речь');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCategory = async (name, icon, color) => {
    try {
      const newCat = await createCategory({ name, icon, color });
      await updateTransaction(suggest.transactionId, { category_id: newCat.id });
      setSuggest({ visible: false, suggestedName: '', transactionId: null });
      onResult?.(newCat);
    } catch (e) {
      const detail = e.response?.data?.detail || '';
      if (detail.includes('уже существует')) throw new Error('Такая категория уже есть');
      if (!e.response) throw new Error('Нет связи с сервером');
      throw new Error(detail || 'Не удалось создать категорию');
    }
  };

  const handleLinkCategory = async (cat) => {
    try {
      await updateTransaction(suggest.transactionId, { category_id: cat.id });
      setSuggest({ visible: false, suggestedName: '', transactionId: null });
      onResult?.(cat);
    } catch (e) {
      if (!e.response) throw new Error('Нет связи с сервером');
      throw new Error('Не удалось привязать категорию');
    }
  };

  const handleSkip = () => {
    setSuggest({ visible: false, suggestedName: '', transactionId: null });
    onResult?.(null);
  };

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
      {isRecording && <TouchableOpacity style={styles.cancelOverlay} activeOpacity={1} onPress={cancel} />}

      <View style={styles.ringZone}>
        {isRecording && (
          <>
            <Animated.View style={[styles.ring, { transform: [{ scale: ring1 }], opacity: ring1 }]} />
            <Animated.View style={[styles.ring, { transform: [{ scale: ring2 }], opacity: ring2 }]} />
          </>
        )}

        <TouchableOpacity
          onPress={isRecording ? stopAndSend : start}
          disabled={disabled || isProcessing}
          activeOpacity={0.85}
          style={styles.btnTouch}
        >
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.micButton, shadows.float, (disabled || isProcessing) && { opacity: 0.6 }]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="mic" size={28} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {(isProcessing || isRecording) && (
        <Text style={styles.timerText}>
          {isProcessing ? 'Распознаём...' : formatDuration(duration)}
        </Text>
      )}
      {isRecording && <Text style={styles.hintText}>Клик мимо — отмена</Text>}

      <SuggestCategoryModal
        visible={suggest.visible}
        suggestedName={suggest.suggestedName}
        categories={suggestCategories}
        onConfirm={handleCreateCategory}
        onLink={handleLinkCategory}
        onSkip={handleSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 8 },
  cancelOverlay: { position: 'absolute', top: -2000, bottom: -2000, left: -2000, right: -2000, zIndex: 10 },
  ringZone: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 15 },
  ring: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.lavender },
  btnTouch: { zIndex: 20, position: 'relative' },
  micButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontFamily: 'Ubuntu_500Medium', fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  hintText: { fontFamily: 'Ubuntu_400Regular', fontSize: 11, color: colors.terracotta, marginTop: -4 },
});