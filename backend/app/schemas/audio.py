from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID

class AudioAssetBase(BaseModel):
    storage_bucket: str = Field("echosync-audio-vault", description="S3/Cloudflare R2 bucket name")
    r2_object_key: str = Field(..., description="Full path key inside S3 object storage")
    file_name: str = Field(..., description="Original uploaded or generated file name")
    content_hash: str = Field(..., description="SHA256 hex string for deduplication")
    mime_type: str = Field("audio/wav", description="MIME media content type")
    file_size_bytes: int = Field(..., description="Binary file size in bytes")
    duration_seconds: float = Field(..., description="Audio duration in seconds")
    sample_rate: int = Field(22050, description="Audio sampling frequency in Hz")
    channels: int = Field(1, description="Number of audio channels")
    bit_depth: int = Field(16, description="Quantization bit depth")
    is_reference_sample: bool = Field(False, description="True if uploaded reference clip; false if synthesized output")
    metadata: Optional[dict] = Field(default_factory=dict, description="DSP metadata")

class AudioAssetCreate(AudioAssetBase):
    pass

class AudioAssetResponse(AudioAssetBase):
    id: UUID = Field(..., description="Unique asset surrogate identifier")
    user_id: Optional[UUID] = Field(None, description="Asset owner reference")
    created_at: datetime = Field(..., description="Record upload/creation timestamp")
    updated_at: datetime = Field(..., description="Record update timestamp")

    model_config = ConfigDict(from_attributes=True)

class AudioUploadResponse(BaseModel):
    file_id: str = Field(..., description="Unique identifier for the uploaded reference audio")
    duration_s: float = Field(..., description="Duration of the audio file in seconds")
    sample_rate: int = Field(..., description="Sample rate of the uploaded audio")
    channels: int = Field(1, description="Number of audio channels (1=mono, 2=stereo)")
    file_size_bytes: int = Field(..., description="Size of the uploaded reference file in bytes")
