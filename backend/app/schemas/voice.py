from pydantic import BaseModel, Field
from datetime import datetime, timezone

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
