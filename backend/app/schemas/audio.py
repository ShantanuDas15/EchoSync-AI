from pydantic import BaseModel, Field

class AudioUploadResponse(BaseModel):
    file_id: str = Field(..., description="Unique identifier for the uploaded reference audio")
    duration_s: float = Field(..., description="Duration of the audio file in seconds")
    sample_rate: int = Field(..., description="Sample rate of the uploaded audio")
