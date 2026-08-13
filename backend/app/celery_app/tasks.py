import time
import logging
import math
import redis
import traceback
from datetime import datetime, timezone
import uuid
import hashlib
from celery import Task
from app.celery_app.worker import celery_app
from app.core.config import settings
from app.services.supabase_client import SupabaseVectorClient

logger = logging.getLogger(__name__)

EOF_PACKET = b"\x00\xFF"
_supabase = SupabaseVectorClient()

class DLQTask(Task):
    """Custom Task class that implements a Dead Letter Queue (DLQ) by logging permanently failed tasks."""
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(
            f"[DLQ ALERT] Task {self.name}[{task_id}] failed after max retries. "
            f"Possible OOM or severe network error. Exception: {exc}"
        )
        try:
            _supabase.update_synthesis_job(task_id, {
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error_detail": {"exception": str(exc), "traceback": einfo.traceback}
            })
        except Exception as update_err:
            logger.error(f"Failed to update task {task_id} as failed in DB: {update_err}")
        super().on_failure(exc, task_id, args, kwargs, einfo)

def simulate_audio_generation_and_publish(task_id: str, duration_sec: float = 2.0, speed: float = 1.0, text: str = ""):
    redis_client = redis.from_url(settings.REDIS_URL)
    channel_name = f"audio_stream_{task_id}"
    
    sample_rate = 22050
    # 50ms chunks = 0.05 * 22050 = 1102 samples
    chunk_samples = int(sample_rate * 0.05)
    total_samples = int(sample_rate * duration_sec)
    
    start_time = time.time()
    first_chunk_sent = False
    ttfb_ms = 0
    
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
        
        if not first_chunk_sent:
            ttfb_ms = int((time.time() - start_time) * 1000)
            try:
                _supabase.update_synthesis_job(task_id, {
                    "status": "streaming",
                    "ttfb_ms": ttfb_ms
                })
            except Exception as e:
                logger.error(f"Failed to update TTFB for task {task_id}: {e}")
            first_chunk_sent = True

        time.sleep(0.05)
        
    # Send EOF packet
    redis_client.publish(channel_name, EOF_PACKET)
    redis_client.close()
    
    end_time = time.time()
    compute_time_ms = int((end_time - start_time) * 1000)
    rtf = (compute_time_ms / 1000.0) / duration_sec if duration_sec > 0 else 0.0
    
    # Store generated WAV in audio_assets
    audio_asset_id = str(uuid.uuid4())
    r2_key = f"synthesized/{task_id}.wav"
    file_size_bytes = total_samples * 2
    # Simple hash for mock content
    content_hash = hashlib.sha256(f"{task_id}-{duration_sec}".encode()).hexdigest()
    
    asset_data = {
        "id": audio_asset_id,
        "r2_object_key": r2_key,
        "file_name": f"{task_id}.wav",
        "content_hash": content_hash,
        "file_size_bytes": file_size_bytes,
        "duration_seconds": duration_sec,
        "sample_rate": sample_rate,
        "is_reference_sample": False
    }
    
    try:
        _supabase.insert_audio_asset(asset_data)
        # We need the synthesis job ID to link it for usage logs
        job = _supabase.get_synthesis_job(task_id)
        job_uuid = job.get('id') if job else None
        
        _supabase.update_synthesis_job(task_id, {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "real_time_factor": round(rtf, 4),
            "output_audio_id": audio_asset_id
        })
        
        # Insert billing log
        usage_data = {
            "characters_count": len(text),
            "audio_duration_seconds": round(duration_sec, 3),
            "compute_ms": compute_time_ms
        }
        if job_uuid:
            usage_data["synthesis_job_id"] = job_uuid
            
        _supabase.insert_usage_log(usage_data)
        
    except Exception as e:
        logger.error(f"Failed to record completion for task {task_id}: {e}")
    
    return audio_asset_id


@celery_app.task(
    name="process_voice_cloning_task", 
    bind=True,
    base=DLQTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def process_voice_cloning_task(self, task_id: str, filename: str, text: str):
    logger.info(f"Starting voice cloning task: {task_id}, file: {filename}, text: {text}")
    try:
        _supabase.update_synthesis_job(task_id, {
            "status": "processing",
            "started_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error marking task {task_id} as processing: {e}")
        
    audio_asset_id = simulate_audio_generation_and_publish(task_id, duration_sec=1.5, text=text)
    logger.info(f"Completed voice cloning task: {task_id}")
    return {
        "task_id": task_id,
        "status": "completed",
        "result_url": f"https://cdn.echosync.ai/audio/{task_id}.wav",
        "output_audio_id": audio_asset_id,
        "message": "Voice cloning completed successfully."
    }

@celery_app.task(
    name="process_tts_task", 
    bind=True,
    base=DLQTask,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def process_tts_task(self, task_id: str, text: str, voice_id: str, speed: float = 1.0, pitch: float = 1.0):
    logger.info(f"Starting TTS task: {task_id}, voice_id: {voice_id}, text: {text}, speed: {speed}, pitch: {pitch}")
    try:
        _supabase.update_synthesis_job(task_id, {
            "status": "processing",
            "started_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error marking TTS task {task_id} as processing: {e}")
        
    audio_asset_id = simulate_audio_generation_and_publish(task_id, duration_sec=1.5, speed=speed, text=text)
    logger.info(f"Completed TTS task: {task_id}")
    return {
        "task_id": task_id,
        "status": "completed",
        "result_url": f"https://cdn.echosync.ai/audio/{task_id}.wav",
        "output_audio_id": audio_asset_id,
        "message": "TTS synthesis completed successfully."
    }

