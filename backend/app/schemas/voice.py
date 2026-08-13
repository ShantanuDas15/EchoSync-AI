from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

class SpeakerProfileBase(BaseModel):
    speaker_name: str = Field(..., description="Human-readable name for the target voice profile")
    description: Optional[str] = Field(None, description="Optional description of voice characteristics")
    gender: Optional[str] = Field("unspecified", description="Vocal gender profile annotation")
    language_code: Optional[str] = Field("en-US", description="ISO language/locale code")
    visibility: Optional[str] = Field("private", description="Access control scope for the voice profile")
    reference_audio_url: Optional[str] = Field(None, description="URL for playback preview")
    is_active: Optional[bool] = Field(True, description="Active state flag")
    metadata: Optional[dict] = Field(default_factory=dict, description="Extensible voice profile metadata")

class SpeakerProfileCreate(SpeakerProfileBase):
    reference_audio_id: Optional[UUID] = Field(None, description="Foreign key to the primary reference audio asset")
    # embedding should typically not be exposed directly in Create schemas unless strictly needed, but let's leave it out of Create

class SpeakerProfileUpdate(BaseModel):
    speaker_name: Optional[str] = None
    description: Optional[str] = None
    gender: Optional[str] = None
    language_code: Optional[str] = None
    visibility: Optional[str] = None
    reference_audio_url: Optional[str] = None
    is_active: Optional[bool] = None
    metadata: Optional[dict] = None

class SpeakerProfileResponse(SpeakerProfileBase):
    id: UUID = Field(..., description="Unique voice profile identifier")
    user_id: Optional[UUID] = Field(None, description="Owning user (NULL for public system presets)")
    reference_audio_id: Optional[UUID] = Field(None, description="Foreign key to the primary reference audio asset")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record update timestamp")

    model_config = ConfigDict(from_attributes=True)

class VoiceCloneRequest(BaseModel):
    voice_id: str = Field(..., description="Unique identifier for the cloned voice profile")
    description: str | None = Field(None, description="Optional description of the voice profile")

class VoiceCloneResponse(BaseModel):
    task_id: str = Field(..., description="Unique task identifier for tracking async cloning execution")
    status: str = Field("queued", description="Execution status (queued, processing, completed, failed)")
    voice_id: str = Field(..., description="Unique identifier generated for the target voice profile")
    message: str = Field("Voice cloning task dispatched successfully", description="Status details")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO timestamp")

class TTSGenerateRequest(BaseModel):
    voice_id: str = Field(..., min_length=1, description="Target voice profile ID for synthesis")
    text: str = Field(..., min_length=1, max_length=5000, description="Text payload to synthesize")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="Synthesis playback speed modifier")
    pitch: float = Field(1.0, ge=0.5, le=2.0, description="Synthesis pitch shift modifier")

class TTSGenerateResponse(BaseModel):
    task_id: str = Field(..., description="Unique task identifier for tracking async TTS generation")
    status: str = Field("queued", description="Execution status (queued, processing, completed, failed)")
    message: str = Field("TTS synthesis task dispatched successfully", description="Status details")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO timestamp")

class TaskStatusResponse(BaseModel):
    task_id: str = Field(..., description="Task identifier")
    status: str = Field(..., description="Current status of the task")
    result: dict | None = Field(None, description="Task output result payload if completed")
    error: str | None = Field(None, description="Error detail if task failed")
