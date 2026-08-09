from pydantic import BaseModel, Field

class VoiceCloneRequest(BaseModel):
    voice_id: str = Field(..., description="Unique identifier for the cloned voice profile")
    description: str | None = Field(None, description="Optional description of the voice profile")

class TTSGenerateRequest(BaseModel):
    voice_id: str = Field(..., description="Target voice profile ID for synthesis")
    text: str = Field(..., description="Text payload to synthesize")
