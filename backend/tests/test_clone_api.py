import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
def mock_wav_bytes():
    """Generates a minimal mock WAV file byte sequence."""
    # 44-byte standard WAV header + dummy PCM data
    header = (
        b"RIFF" + (36).to_bytes(4, "little") + b"WAVE" +
        b"fmt " + (16).to_bytes(4, "little") + (1).to_bytes(2, "little") +
        (1).to_bytes(2, "little") + (22050).to_bytes(4, "little") +
        (44100).to_bytes(4, "little") + (2).to_bytes(2, "little") +
        (16).to_bytes(2, "little") + b"data" + (0).to_bytes(4, "little")
    )
    return header

@pytest.mark.asyncio
async def test_clone_voice_valid_payload(mock_wav_bytes):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("reference_sample.wav", mock_wav_bytes, "audio/wav")}
        data = {"text": "Welcome to EchoSync AI zero-shot voice synthesis.", "voice_name": "TestSpeaker"}
        
        response = await ac.post("/api/v1/voice/clone", files=files, data=data)

    assert response.status_code == 202
    res_data = response.json()
    assert res_data["status"] == "queued"
    assert res_data["task_id"].startswith("clone-")
    assert res_data["voice_id"] == "TestSpeaker"
    assert "queued successfully" in res_data["message"]

@pytest.mark.asyncio
async def test_clone_voice_missing_text(mock_wav_bytes):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("sample.wav", mock_wav_bytes, "audio/wav")}
        data = {"text": "   "}  # Whitespace only
        
        response = await ac.post("/api/v1/voice/clone", files=files, data=data)

    assert response.status_code == 422

@pytest.mark.asyncio
async def test_clone_voice_invalid_extension():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("script.txt", b"invalid payload text", "text/plain")}
        data = {"text": "Valid text prompt"}
        
        response = await ac.post("/api/v1/voice/clone", files=files, data=data)

    assert response.status_code == 422
    assert "Unsupported file format" in response.json()["detail"]

@pytest.mark.asyncio
async def test_clone_voice_empty_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("empty.wav", b"", "audio/wav")}
        data = {"text": "Valid prompt"}
        
        response = await ac.post("/api/v1/voice/clone", files=files, data=data)

    assert response.status_code == 422
    assert "empty (0 bytes)" in response.json()["detail"]

@pytest.mark.asyncio
async def test_tts_generate_valid_payload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "text": "Testing text-to-speech endpoint synthesis queue.",
            "voice_id": "speaker-alpha-001",
            "speed": 1.0,
            "pitch": 1.0,
        }
        response = await ac.post("/api/v1/tts/generate", json=payload)

    assert response.status_code == 202
    res_data = response.json()
    assert res_data["status"] == "queued"
    assert res_data["task_id"].startswith("tts-")

@pytest.mark.asyncio
async def test_tts_generate_empty_text():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "text": "   ",
            "voice_id": "speaker-alpha-001",
        }
        response = await ac.post("/api/v1/tts/generate", json=payload)

    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_task_status_and_not_found(mock_wav_bytes):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First dispatch a task
        files = {"file": ("sample.wav", mock_wav_bytes, "audio/wav")}
        data = {"text": "Synthesize this text"}
        post_res = await ac.post("/api/v1/voice/clone", files=files, data=data)
        task_id = post_res.json()["task_id"]

        # Fetch status for valid task
        status_res = await ac.get(f"/api/v1/voice/tasks/{task_id}")
        assert status_res.status_code == 200
        assert status_res.json()["task_id"] == task_id
        assert status_res.json()["status"] == "queued"

        # Fetch status for nonexistent task
        not_found_res = await ac.get("/api/v1/voice/tasks/nonexistent-task-id")
        assert not_found_res.status_code == 404
