import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

EOF_PACKET = b"\x00\xFF"

@pytest.fixture
def mock_redis_pubsub():
    with patch("app.api.v1.endpoints.stream.redis.from_url") as mock_from_url:
        mock_redis = MagicMock()
        mock_redis.aclose = AsyncMock()
        mock_pubsub = AsyncMock()
        
        # Simulate the async generator or get_message method for pubsub
        # The endpoint uses: message = await asyncio.wait_for(pubsub.get_message(...))
        # So we mock get_message to return a sequence of messages
        
        # We will yield two dummy PCM chunks and then the EOF packet
        responses = [
            {"type": "message", "data": b"dummy_pcm_chunk_1"},
            {"type": "message", "data": b"dummy_pcm_chunk_2"},
            {"type": "message", "data": EOF_PACKET},
        ]
        
        async def mock_get_message(ignore_subscribe_messages=True):
            if responses:
                return responses.pop(0)
            return None
            
        mock_pubsub.get_message = mock_get_message
        mock_redis.pubsub.return_value = mock_pubsub
        mock_from_url.return_value = mock_redis
        
        yield mock_pubsub


def test_websocket_audio_stream(mock_redis_pubsub):
    client = TestClient(app)
    task_id = "test-task-id-123"
    
    received_chunks = []
    
    with client.websocket_connect(f"/ws/v1/stream/{task_id}") as websocket:
        while True:
            try:
                data = websocket.receive_bytes()
                received_chunks.append(data)
                if data == EOF_PACKET:
                    break
            except Exception:
                break
                
    assert len(received_chunks) == 3
    assert received_chunks[0] == b"dummy_pcm_chunk_1"
    assert received_chunks[1] == b"dummy_pcm_chunk_2"
    assert received_chunks[2] == EOF_PACKET
