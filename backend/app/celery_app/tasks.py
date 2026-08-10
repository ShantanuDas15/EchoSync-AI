import time
import logging
import math
import redis
from app.celery_app.worker import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

EOF_PACKET = b"\x00\xFF"

def simulate_audio_generation_and_publish(task_id: str, duration_sec: float = 2.0):
    redis_client = redis.from_url(settings.REDIS_URL)
    channel_name = f"audio_stream_{task_id}"
    
    sample_rate = 22050
    # 50ms chunks = 0.05 * 22050 = 1102 samples
    chunk_samples = int(sample_rate * 0.05)
    total_samples = int(sample_rate * duration_sec)
    
    # Send chunks
    for i in range(0, total_samples, chunk_samples):
        samples = min(chunk_samples, total_samples - i)
        byte_array = bytearray(samples * 2)
        for j in range(samples):
            t = (i + j) / sample_rate
            val = int(0.5 * math.sin(2.0 * math.pi * 440 * t) * 32767.0)
            byte_array[j * 2] = val & 0xFF
            byte_array[j * 2 + 1] = (val >> 8) & 0xFF
        
        # Publish binary PCM chunk to Redis pub/sub
        redis_client.publish(channel_name, bytes(byte_array))
        time.sleep(0.05)
        
    # Send EOF packet
    redis_client.publish(channel_name, EOF_PACKET)
    redis_client.close()


@celery_app.task(name="process_voice_cloning_task", bind=True)
def process_voice_cloning_task(self, task_id: str, filename: str, text: str):
    logger.info(f"Starting voice cloning task: {task_id}, file: {filename}, text: {text}")
    simulate_audio_generation_and_publish(task_id, duration_sec=1.5)
    logger.info(f"Completed voice cloning task: {task_id}")
    return {
        "task_id": task_id,
        "status": "completed",
        "result_url": f"https://cdn.echosync.ai/audio/{task_id}.wav",
        "message": "Voice cloning completed successfully."
    }

@celery_app.task(name="process_tts_task", bind=True)
def process_tts_task(self, task_id: str, text: str, voice_id: str, speed: float = 1.0, pitch: float = 1.0):
    logger.info(f"Starting TTS task: {task_id}, voice_id: {voice_id}, text: {text}, speed: {speed}, pitch: {pitch}")
    simulate_audio_generation_and_publish(task_id, duration_sec=1.5)
    logger.info(f"Completed TTS task: {task_id}")
    return {
        "task_id": task_id,
        "status": "completed",
        "result_url": f"https://cdn.echosync.ai/audio/{task_id}.wav",
        "message": "TTS synthesis completed successfully."
    }
