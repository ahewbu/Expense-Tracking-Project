# app/services/asr.py
import io
import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

# Глобальная переменная для кэширования модели (чтобы не загружать её при каждом запросе)
_model = None

def get_whisper_model() -> WhisperModel:
    """
    Возвращает экземпляр модели Whisper.
    Загружает модель в память только при первом вызове (Lazy Loading).
    """
    global _model
    if _model is None:
        logger.info("🔄 Загрузка модели faster-whisper (размер: base)... Это может занять 10-20 секунд при первом запуске.")
        try:
            # device="cpu" (для совместимости). Если в будущем будет GPU, поменяем на "cuda"
            # compute_type="int8" значительно экономит оперативную память и ускоряет работу на CPU
            _model = WhisperModel("base", device="cpu", compute_type="int8")
            logger.info("✅ Модель faster-whisper успешно загружена в память")
        except Exception as e:
            logger.error(f"Критическая ошибка при загрузке модели Whisper: {e}", exc_info=True)
            raise RuntimeError("Не удалось загрузить модель ASR")
    
    return _model


def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Принимает байты аудиофайла и возвращает распознанный текст.
    """
    try:
        model = get_whisper_model()
        
        # faster-whisper умеет работать с file-like объектами, превращаем bytes в BytesIO
        audio_file = io.BytesIO(audio_bytes)
        
        logger.info("🎙 Начало транскрибации аудио...")
        
        # beam_size=5 дает хороший баланс между скоростью и точностью
        # language="ru" заставляет модель сразу искать русскую речь (ускоряет процесс)
        segments, info = model.transcribe(audio_file, beam_size=5, language="ru")
        
        # Собираем текст из всех сегментов
        text = "".join([segment.text for segment in segments]).strip()
        
        logger.info(f"🎯 Транскрибация завершена успешно. Распознано: '{text}'")
        return text
        
    except Exception as e:
        logger.error(f"Ошибка при транскрибации аудио: {e}", exc_info=True)
        raise ValueError("Не удалось распознать аудио. Проверьте формат и качество файла.")