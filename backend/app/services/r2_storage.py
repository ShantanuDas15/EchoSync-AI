import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import aioboto3
    from botocore.config import Config
    HAS_AIOBOTO3 = True
except ImportError:
    HAS_AIOBOTO3 = False
    logger.warning("aioboto3 package not installed. R2StorageService will operate in mock mode.")


class R2StorageService:
    def __init__(self):
        self.account_id = settings.R2_ACCOUNT_ID
        self.access_key = settings.R2_ACCESS_KEY_ID
        self.secret_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME if settings.R2_BUCKET_NAME else "echosync-audio-vault"
        
        self.is_mock = not HAS_AIOBOTO3 or not self.account_id or not self.access_key or not self.secret_key
        self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com" if self.account_id else None
        
        if hasattr(settings, "R2_ENDPOINT_URL_OVERRIDE") and settings.R2_ENDPOINT_URL_OVERRIDE:
            self.endpoint_url = settings.R2_ENDPOINT_URL_OVERRIDE
            self.is_mock = False # If overridden (e.g. for testing), do not mock
            
        if not self.is_mock:
            self.session = aioboto3.Session(
                aws_access_key_id=self.access_key or "mock_access_key",
                aws_secret_access_key=self.secret_key or "mock_secret_key",
                region_name="auto"
            )
            self.boto_config = Config(
                signature_version="s3v4",
                s3={'addressing_style': 'path'}  # path style often preferred for moto mocks
            )

    async def upload_file(self, file_content: bytes, object_name: str, content_type: str = "audio/wav") -> bool:
        """
        Uploads a binary payload asynchronously to Cloudflare R2 bucket.
        """
        if self.is_mock:
            logger.info(f"[MOCK] Uploading to R2 bucket '{self.bucket_name}' as {object_name}")
            return True

        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url, config=self.boto_config) as client:
                await client.put_object(
                    Bucket=self.bucket_name,
                    Key=object_name,
                    Body=file_content,
                    ContentType=content_type
                )
                return True
        except Exception as e:
            logger.error(f"Failed to upload file to R2: {e}")
            return False

    async def generate_presigned_url(self, object_name: str, expiration_seconds: int = 3600) -> Optional[str]:
        """
        Generates a presigned URL with 1-hour expiration for public audio sample streaming.
        """
        if self.is_mock:
            logger.info(f"[MOCK] Generating presigned URL for {object_name} with expiration {expiration_seconds}s")
            return f"https://mock-r2-bucket.local/{object_name}?token=mock-presigned-token"

        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url, config=self.boto_config) as client:
                url = await client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': object_name},
                    ExpiresIn=expiration_seconds
                )
                return url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None

    async def delete_file(self, object_name: str) -> bool:
        """
        Prunes a binary payload from R2 (e.g. after soft-deletion).
        """
        if self.is_mock:
            logger.info(f"[MOCK] Deleting {object_name} from R2 bucket '{self.bucket_name}'")
            return True

        try:
            async with self.session.client('s3', endpoint_url=self.endpoint_url, config=self.boto_config) as client:
                await client.delete_object(
                    Bucket=self.bucket_name,
                    Key=object_name
                )
                return True
        except Exception as e:
            logger.error(f"Failed to delete file from R2: {e}")
            return False

r2_service = R2StorageService()
