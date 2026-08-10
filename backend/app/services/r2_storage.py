import logging
import datetime
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    logger.warning("boto3 package not installed. R2StorageClient will operate in mock mode.")


class R2StorageClient:
    def __init__(self):
        self.account_id = settings.R2_ACCOUNT_ID
        self.access_key = settings.R2_ACCESS_KEY_ID
        self.secret_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME
        
        self.is_mock = not HAS_BOTO3 or not self.account_id or not self.access_key or not self.secret_key
        self._s3_client = None

        if not self.is_mock:
            self._s3_client = boto3.client(
                's3',
                endpoint_url=f"https://{self.account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name="auto"
            )

    def upload_file(self, file_path: str, object_name: str, content_type: str = "audio/wav") -> bool:
        """
        Uploads a file to Cloudflare R2 bucket.
        """
        if self.is_mock:
            logger.info(f"[MOCK] Uploading {file_path} to R2 bucket '{self.bucket_name}' as {object_name}")
            return True

        try:
            self._s3_client.upload_file(
                file_path,
                self.bucket_name,
                object_name,
                ExtraArgs={'ContentType': content_type}
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upload file to R2: {e}")
            return False

    def generate_presigned_url(self, object_name: str, expiration_seconds: int = 3600) -> Optional[str]:
        """
        Generates a presigned URL with 1-hour expiration for public audio sample streaming.
        """
        if self.is_mock:
            logger.info(f"[MOCK] Generating presigned URL for {object_name} with expiration {expiration_seconds}s")
            return f"https://mock-r2-bucket.local/{object_name}?token=mock-presigned-token"

        try:
            response = self._s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expiration_seconds
            )
            return response
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None
