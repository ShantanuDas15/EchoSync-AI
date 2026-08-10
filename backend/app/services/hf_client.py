import base64
import logging
from typing import Dict, Any, Optional, List
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

class HuggingFaceInferenceError(Exception):
    pass

class HuggingFaceClient:
    def __init__(
        self,
        space_url: Optional[str] = None,
        api_token: Optional[str] = None,
        timeout: float = 30.0,
        client: Optional[httpx.AsyncClient] = None
    ):
        self.space_url = (space_url or settings.HF_SPACE_URL).rstrip("/")
        self.api_token = api_token or settings.HF_API_TOKEN
        self.timeout = timeout
        self._client = client

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
        return headers

    async def _request(self, method: str, endpoint: str, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.space_url}{endpoint}"
        headers = self._get_headers()

        try:
            if self._client:
                response = await self._client.request(method, url, json=json_data, headers=headers, timeout=self.timeout)
            else:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(method, url, json=json_data, headers=headers)
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(f"Hugging Face Space HTTP error: {exc.response.status_code} - {exc.response.text}")
            raise HuggingFaceInferenceError(f"HF Space returned error {exc.response.status_code}") from exc
        except httpx.RequestError as exc:
            logger.error(f"Hugging Face Space connection error: {exc}")
            raise HuggingFaceInferenceError(f"Failed to connect to HF Space endpoint '{url}': {exc}") from exc

    async def check_health(self) -> Dict[str, Any]:
        return await self._request("GET", "/health")

    async def clone_voice(
        self,
        text: str,
        audio_bytes: Optional[bytes] = None,
        audio_base64: Optional[str] = None,
        speaker_embedding: Optional[List[float]] = None,
        speed: float = 1.0,
        pitch: float = 1.0
    ) -> Dict[str, Any]:
        if audio_bytes and not audio_base64:
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        payload = {
            "text": text,
            "audio_base64": audio_base64,
            "speaker_embedding": speaker_embedding,
            "speed": speed,
            "pitch": pitch,
        }
        return await self._request("POST", "/api/v1/inference/clone", json_data=payload)

    async def generate_tts(
        self,
        text: str,
        speaker_preset: str = "default",
        speaker_embedding: Optional[List[float]] = None,
        speed: float = 1.0,
        pitch: float = 1.0
    ) -> Dict[str, Any]:
        payload = {
            "text": text,
            "speaker_preset": speaker_preset,
            "speaker_embedding": speaker_embedding,
            "speed": speed,
            "pitch": pitch,
        }
        return await self._request("POST", "/api/v1/inference/tts", json_data=payload)
