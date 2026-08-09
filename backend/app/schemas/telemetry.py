from pydantic import BaseModel, Field

class RTFMetrics(BaseModel):
    synthesis_time_s: float = Field(..., description="Wall-clock execution time for synthesis")
    audio_length_s: float = Field(..., description="Duration of generated audio")
    rtf: float = Field(..., description="Real-Time Factor (synthesis_time / audio_length)")
