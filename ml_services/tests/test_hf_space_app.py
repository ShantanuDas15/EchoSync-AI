import base64
import time
import pytest
from httpx import AsyncClient, ASGITransport

from ml_services.hf_space.app import app

@pytest.mark.asyncio
async def test_hf_space_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "EchoSync" in data["service"]

@pytest.mark.asyncio
async def test_hf_space_voice_clone():
    start_time = time.time()
    transport = ASGITransport(app=app)
    
    payload = {
        "text": "Testing voice clone inference.",
        "speed": 1.0,
        "pitch": 1.0
    }
    
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/inference/clone", json=payload)
    
    end_time = time.time()
    latency_ms = (end_time - start_time) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert "audio_pcm_base64" in data
    assert len(data["audio_pcm_base64"]) > 0
    assert data["status"] == "success"
    
    assert latency_ms < 800.0, f"Inference latency too high: {latency_ms:.2f} ms"

@pytest.mark.asyncio
async def test_hf_space_tts():
    start_time = time.time()
    transport = ASGITransport(app=app)
    
    payload = {
        "text": "Testing text to speech inference.",
        "speaker_preset": "default"
    }
    
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/inference/tts", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "audio_pcm_base64" in data
    assert data["sample_rate"] == 22050
