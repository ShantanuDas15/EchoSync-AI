import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    logger.warning("Supabase package not installed. SupabaseVectorClient will operate in mock mode.")


class SupabaseVectorClient:
    def __init__(self):
        self.url = getattr(settings, "SUPABASE_URL", None)
        self.key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
        self._client: Optional[Client] = None
        
        if HAS_SUPABASE and self.url and self.key:
            try:
                self._client = create_client(self.url, self.key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self._client = None

    def is_mock(self) -> bool:
        return not HAS_SUPABASE or not self.url or not self.key or self._client is None

    def search_similar_voices(
        self, 
        vector: List[float], 
        limit: int = 5, 
        match_threshold: float = 0.70,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute 256-d d-vector cosine similarity query using pgvector via stored RPC function 'match_voices'.
        """
        if self.is_mock():
            logger.info(f"[MOCK] Searching similar voices with vector length {len(vector)}, limit {limit}, threshold {match_threshold}")
            return [
                {
                    "id": "voice-1", 
                    "similarity": 0.95, 
                    "speaker_name": "Mock Voice Alpha",
                    "description": "Clear studio male voice",
                    "gender": "male",
                    "language_code": "en-US",
                    "reference_audio_url": "https://storage.example.com/demo1.wav"
                },
                {
                    "id": "voice-2", 
                    "similarity": 0.88, 
                    "speaker_name": "Mock Voice Beta",
                    "description": "Warm narrative female voice",
                    "gender": "female",
                    "language_code": "en-US",
                    "reference_audio_url": "https://storage.example.com/demo2.wav"
                }
            ]

        try:
            params = {
                "query_embedding": vector,
                "match_threshold": match_threshold,
                "match_count": limit,
            }
            if user_id:
                params["filter_user_id"] = user_id

            response = self._client.rpc("match_voices", params).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error querying Supabase vector storage: {e}")
            raise

    def insert_voice_vector(
        self, 
        voice_id: str, 
        vector: List[float], 
        speaker_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        reference_audio_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Inserts a new 256-d vector into the 'speaker_profiles' table.
        """
        if self.is_mock():
            logger.info(f"[MOCK] Inserting voice vector for {voice_id} with length {len(vector)}")
            return {"id": voice_id, "status": "success", "mock": True}

        data = {
            "id": voice_id,
            "speaker_name": speaker_name or (metadata.get("name") if metadata else None) or voice_id,
            "embedding": vector,
            "metadata": metadata or {}
        }
        if user_id:
            data["user_id"] = user_id
        if reference_audio_id:
            data["reference_audio_id"] = reference_audio_id

        try:
            response = self._client.table("speaker_profiles").insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.warning(f"Error inserting into speaker_profiles, attempting fallback: {e}")
            try:
                fallback_data = {"id": voice_id, "embedding": vector, **(metadata or {})}
                response = self._client.table("voices").insert(fallback_data).execute()
                return response.data[0] if response.data else {}
            except Exception as fallback_err:
                logger.error(f"Error inserting vector into Supabase: {fallback_err}")
                raise

    def get_speaker_profile(self, voice_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a speaker profile by ID."""
        if self.is_mock():
            logger.info(f"[MOCK] Retrieving speaker profile {voice_id}")
            return {"id": voice_id, "speaker_name": "Mock Profile"}
        try:
            response = self._client.table("speaker_profiles").select("*").eq("id", voice_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error retrieving speaker profile {voice_id}: {e}")
            raise

    def insert_synthesis_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new synthesis job record."""
        if self.is_mock():
            logger.info(f"[MOCK] Inserting synthesis job: {job_data.get('task_id')}")
            return {"id": "mock-job-id", **job_data}
        try:
            response = self._client.table("synthesis_jobs").insert(job_data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error inserting synthesis job: {e}")
            raise

    def update_synthesis_job(self, task_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing synthesis job record."""
        if self.is_mock():
            logger.info(f"[MOCK] Updating synthesis job {task_id} with {update_data}")
            return {"task_id": task_id, **update_data}
        try:
            response = self._client.table("synthesis_jobs").update(update_data).eq("task_id", task_id).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error updating synthesis job {task_id}: {e}")
            raise

    def get_synthesis_job(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a synthesis job record by task_id."""
        if self.is_mock():
            logger.info(f"[MOCK] Retrieving synthesis job {task_id}")
            return {"task_id": task_id, "status": "completed"}
        try:
            response = self._client.table("synthesis_jobs").select("*").eq("task_id", task_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error retrieving synthesis job {task_id}: {e}")
            raise

    def insert_audio_asset(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new audio asset record."""
        if self.is_mock():
            logger.info(f"[MOCK] Inserting audio asset: {asset_data.get('file_name')}")
            return {"id": "mock-asset-id", **asset_data}
        try:
            response = self._client.table("audio_assets").insert(asset_data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error inserting audio asset: {e}")
            raise

    def get_audio_asset(self, asset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves an audio asset record by ID."""
        if self.is_mock():
            logger.info(f"[MOCK] Retrieving audio asset {asset_id}")
            return {"id": asset_id, "file_name": "mock.wav"}
        try:
            response = self._client.table("audio_assets").select("*").eq("id", asset_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error retrieving audio asset {asset_id}: {e}")
            raise

    def insert_usage_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new usage log record for billing/analytics."""
        if self.is_mock():
            logger.info(f"[MOCK] Inserting usage log for job {log_data.get('synthesis_job_id')}")
            return {"id": "mock-log-id", **log_data}
        try:
            response = self._client.table("usage_logs").insert(log_data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error inserting usage log: {e}")
            raise
