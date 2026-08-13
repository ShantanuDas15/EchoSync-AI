import uuid
import logging
from typing import Any, Dict
from datetime import datetime, timezone
from app.services.supabase_client import SupabaseVectorClient

logger = logging.getLogger("echosync.task_dispatcher")

class TaskDispatcher:
    """
    Service layer encapsulating asynchronous task orchestration,
    Celery task queue dispatching, and state management.
    """
    _in_memory_tasks: Dict[str, Dict[str, Any]] = {}
    _supabase = SupabaseVectorClient()

    @classmethod
    def dispatch_voice_cloning_task(
        cls,
        file_bytes: bytes,
        filename: str,
        text: str,
        voice_name: str | None = None,
    ) -> str:
        """
        Dispatches a zero-shot voice cloning task to the Celery worker queue.
        Returns unique task_id.
        """
        task_id = f"clone-{uuid.uuid4()}"
        voice_id = voice_name or f"voice-{uuid.uuid4().hex[:8]}"
        
        # We store voice cloning as a synthesis_job since it performs synthesis
        db_job = {
            "task_id": task_id,
            "prompt_text": text,
            "status": "queued",
        }
        
        try:
            cls._supabase.insert_synthesis_job(db_job)
        except Exception as e:
            logger.warning(f"Failed to persist voice cloning task to DB: {e}")

        task_data = {
            "task_id": task_id,
            "task_type": "voice_cloning",
            "status": "queued",
            "voice_id": voice_id,
            "filename": filename,
            "text": text,
            "file_size_bytes": len(file_bytes),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None,
        }
        cls._in_memory_tasks[task_id] = task_data
        
        # Try dispatching to Celery worker if available
        try:
            from app.celery_app.tasks import process_voice_cloning_task
            process_voice_cloning_task.delay(task_id, filename, text)
        except Exception as err:
            logger.debug(f"Celery worker fallback to async in-memory state: {err}")
            
        logger.info(f"Dispatched voice cloning task {task_id} for voice_id {voice_id}")
        return task_id

    @classmethod
    def dispatch_tts_task(
        cls,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 1.0,
    ) -> str:
        """
        Dispatches a direct text-to-speech synthesis task to the Celery worker queue.
        Returns unique task_id.
        """
        task_id = f"tts-{uuid.uuid4()}"
        
        db_job = {
            "task_id": task_id,
            "prompt_text": text,
            "speed_modifier": speed,
            "pitch_modifier": pitch,
            "status": "queued",
            # We would typically resolve voice_id to a UUID speaker_profile_id here
        }
        
        try:
            cls._supabase.insert_synthesis_job(db_job)
        except Exception as e:
            logger.warning(f"Failed to persist TTS task to DB: {e}")

        task_data = {
            "task_id": task_id,
            "task_type": "tts_generation",
            "status": "queued",
            "voice_id": voice_id,
            "text": text,
            "speed": speed,
            "pitch": pitch,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None,
        }
        
        cls._in_memory_tasks[task_id] = task_data
        
        try:
            from app.celery_app.tasks import process_tts_task
            process_tts_task.delay(task_id, text, voice_id, speed, pitch)
        except Exception as err:
            logger.debug(f"Celery worker fallback to async in-memory state: {err}")

        logger.info(f"Dispatched TTS synthesis task {task_id} for voice_id {voice_id}")
        return task_id

    @classmethod
    def get_task_status(cls, task_id: str) -> Dict[str, Any] | None:
        """Retrieves the execution status and output payload for a given task_id."""
        db_job = cls._supabase.get_synthesis_job(task_id)
        if db_job:
            return db_job
        return cls._in_memory_tasks.get(task_id)

task_dispatcher = TaskDispatcher()
