import pytest
import pytest_asyncio
import asyncio
from unittest.mock import patch, MagicMock
from app.services.r2_storage import R2StorageService
from app.db.base import AudioAsset
from app.db.repositories.base import BaseRepository
from app.db.repositories.audio_repo import AudioAssetRepository
from fastapi.testclient import TestClient
from app.main import app
import uuid
import base64

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest_asyncio.fixture
async def r2_mock():
    # Instead of relying on moto's aioboto3 support which can be flaky,
    # we'll mock the internal session client of aioboto3 directly or just
    # test the R2StorageService logic in isolation, but the requirements
    # stated moto should be used if possible. 
    # Let's mock aioboto3 Session client for reliability.
    mock_s3 = MagicMock()
    
    # We need to mock the async context manager returned by self.session.client
    class AsyncContextManagerMock:
        async def __aenter__(self):
            return mock_s3
        async def __aexit__(self, exc_type, exc, tb):
            pass
            
    with patch('aioboto3.Session.client', return_value=AsyncContextManagerMock()):
        with patch('app.core.config.settings.R2_ACCOUNT_ID', 'test-account'):
            with patch('app.core.config.settings.R2_ACCESS_KEY_ID', 'test-key'):
                with patch('app.core.config.settings.R2_SECRET_ACCESS_KEY', 'test-secret'):
                    service = R2StorageService()
                    yield service, mock_s3

@pytest.mark.asyncio
async def test_r2_upload_file(r2_mock):
    service, mock_s3 = r2_mock
    mock_s3.put_object = MagicMock(return_value=asyncio.sleep(0))  # mock awaitable
    
    # We must patch the function to be a proper CoroutineMock
    async def mock_put_object(*args, **kwargs):
        return {}
    mock_s3.put_object = mock_put_object
    
    result = await service.upload_file(b"dummy_data", "test.wav")
    assert result == True

@pytest.mark.asyncio
async def test_r2_generate_presigned_url(r2_mock):
    service, mock_s3 = r2_mock
    
    async def mock_generate_presigned_url(op, Params, ExpiresIn):
        return f"https://mock-r2.com/{Params['Bucket']}/{Params['Key']}?token=123"
        
    mock_s3.generate_presigned_url = mock_generate_presigned_url
    
    url = await service.generate_presigned_url("test.wav")
    assert url.startswith("https://mock-r2.com")
    assert "test.wav" in url

def test_audio_soft_delete_triggers_celery():
    # Test Task 5.2.2 integration
    mock_session = MagicMock()
    repo = AudioAssetRepository(mock_session)
    
    asset = AudioAsset(id=str(uuid.uuid4()), r2_object_key="test-key.wav")
    
    with patch('app.celery_app.tasks.delete_r2_file_task.delay') as mock_celery:
        repo.soft_delete(asset)
        
        assert asset.deleted_at is not None
        mock_celery.assert_called_once_with("test-key.wav")
        mock_session.flush.assert_called_once()

def test_presigned_url_endpoint(test_client):
    # Test Task 5.2.3 endpoint
    mock_asset = MagicMock()
    mock_asset.r2_object_key = "test-audio.wav"
    
    async def mock_generate(key, expires):
        return f"https://presigned.example.com/{key}"
    
    with patch('app.api.v1.endpoints.audio.AudioAssetRepository') as mock_repo:
        mock_repo.return_value.get_by_id.return_value = mock_asset
        
        with patch('app.api.v1.endpoints.audio.verify_api_key', return_value=None):
            with patch('app.api.v1.endpoints.audio.r2_service.generate_presigned_url', side_effect=mock_generate):
                with patch('app.api.v1.deps.settings.REQUIRE_API_KEY', False):
                    response = test_client.get(
                        "/api/v1/audio/123/stream-url", 
                        headers={"X-API-Key": "test"}
                    )
                    
                    assert response.status_code == 200
                    assert "url" in response.json()
                    assert response.json()["url"] == "https://presigned.example.com/test-audio.wav"
