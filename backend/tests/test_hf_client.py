import pytest
from httpx import AsyncClient, ASGITransport

from ml_services.hf_space.app import app as hf_space_app
from app.services.hf_client import HuggingFaceClient, HuggingFaceInferenceError

@pytest.fixture
def mock_hf_client():
    transport = ASGITransport(app=hf_space_app)
    async_client = AsyncClient(transport=transport, base_url="https://echosync-ai-inference.hf.space")
    return HuggingFaceClient(
        space_url="https://echosync-ai-inference.hf.space",
        api_token="test-hf-token",
        client=async_client
    )

@pytest.mark.asyncio
async def test_hf_client_health(mock_hf_client):
    res = await mock_hf_client.check_health()
    assert res["status"] == "healthy"
    assert "EchoSync" in res["service"]

@pytest.mark.asyncio
async def test_hf_client_clone_voice(mock_hf_client):
    res = await mock_hf_client.clone_voice(
        text="HuggingFaceClient integration unit test for voice cloning.",
        audio_bytes=b"RIFF36WAVEfmt 16112205044100216data0",
        speed=1.0,
        pitch=1.0
    )
    assert res["status"] == "success"
    assert "audio_pcm_base64" in res
    assert len(res["speaker_embedding"]) == 256
    assert res["duration_seconds"] > 0

@pytest.mark.asyncio
async def test_hf_client_generate_tts(mock_hf_client):
    res = await mock_hf_client.generate_tts(
        text="HuggingFaceClient integration unit test for direct TTS generation.",
        speaker_preset="default",
        speed=1.0,
        pitch=1.0
    )
    assert res["status"] == "success"
    assert "audio_pcm_base64" in res
    assert res["sample_rate"] == 22050

@pytest.mark.asyncio
async def test_hf_client_error_handling():
    # Test client with invalid URL / unreachable server
    client = HuggingFaceClient(space_url="http://nonexistent-space-url.invalid")
    with pytest.raises(HuggingFaceInferenceError):
        await client.check_health()
