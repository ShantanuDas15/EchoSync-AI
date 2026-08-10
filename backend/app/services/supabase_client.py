import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    logger.warning("Supabase package not installed. SupabaseClient will operate in mock mode.")


class SupabaseVectorClient:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY
        self._client = None
        
        if HAS_SUPABASE and self.url and self.key:
            self._client = create_client(self.url, self.key)

    def is_mock(self) -> bool:
        return not HAS_SUPABASE or not self.url or not self.key

    def search_similar_voices(self, vector: List[float], limit: int = 5, match_threshold: float = 0.8) -> List[Dict[str, Any]]:
        """
        Execute 256-d d-vector cosine similarity query using pgvector via rpc call.
        Assumes a Supabase RPC function 'match_voices' exists.
        """
        if self.is_mock():
            logger.info(f"[MOCK] Searching similar voices with vector length {len(vector)}, limit {limit}, threshold {match_threshold}")
            return [
                {"id": "voice-1", "similarity": 0.95, "name": "Mock Voice Alpha"},
                {"id": "voice-2", "similarity": 0.88, "name": "Mock Voice Beta"}
            ]

        try:
            response = self._client.rpc(
                "match_voices",
                {
                    "query_embedding": vector,
                    "match_threshold": match_threshold,
                    "match_count": limit
                }
            ).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error querying Supabase vector storage: {e}")
            raise

    def insert_voice_vector(self, voice_id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Inserts a new 256-d vector into the 'voices' table.
        """
        if self.is_mock():
            logger.info(f"[MOCK] Inserting voice vector for {voice_id} with length {len(vector)}")
            return {"id": voice_id, "status": "success", "mock": True}

        data = {
            "id": voice_id,
            "embedding": vector,
            **(metadata or {})
        }
        
        try:
            response = self._client.table("voices").insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error inserting vector into Supabase: {e}")
            raise
