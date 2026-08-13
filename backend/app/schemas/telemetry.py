from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class SynthesisJobBase(BaseModel):
    task_id: str = Field(..., description="External public job identifier (Celery task UUID)")
    prompt_text: str = Field(..., description="Raw input text string requested for synthesis")
    phoneme_sequence: Optional[str] = Field(None, description="ARPAbet phoneme sequence")
    speed_modifier: float = Field(1.0, description="Synthesis duration scaling factor")
    pitch_modifier: float = Field(1.0, description="Pitch shift multiplier")
    energy_modifier: float = Field(1.0, description="Energy/volume multiplier")
    acoustic_model: str = Field("fastspeech2_fp16", description="Acoustic spectrogram model runtime artifact ID")
    vocoder_model: str = Field("hifigan_fp16", description="Neural vocoder model runtime artifact ID")
    status: str = Field("queued", description="Lifecycle status indicator")
    real_time_factor: Optional[float] = Field(None, description="Measured RTF metric")
    ttfb_ms: Optional[int] = Field(None, description="Time-To-First-Byte latency in milliseconds")
    worker_id: Optional[str] = Field(None, description="Identifier of the Celery worker node executing job")
    execution_engine: str = Field("hf_cpu_onnx", description="Execution platform")
    error_detail: Optional[Dict[str, Any]] = Field(None, description="Detailed error payload")

class SynthesisJobCreate(SynthesisJobBase):
    speaker_profile_id: Optional[UUID] = Field(None, description="Targeted voice profile reference")

class SynthesisJobUpdate(BaseModel):
    status: Optional[str] = None
    phoneme_sequence: Optional[str] = None
    output_audio_id: Optional[UUID] = None
    real_time_factor: Optional[float] = None
    ttfb_ms: Optional[int] = None
    worker_id: Optional[str] = None
    error_detail: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class SynthesisJobResponse(SynthesisJobBase):
    id: UUID = Field(..., description="Unique internal primary key")
    user_id: Optional[UUID] = Field(None, description="Owning user identifier")
    speaker_profile_id: Optional[UUID] = Field(None, description="Targeted voice profile reference")
    output_audio_id: Optional[UUID] = Field(None, description="Generated WAV audio asset reference")
    queued_at: datetime = Field(..., description="Timestamp when task entered Redis queue")
    started_at: Optional[datetime] = Field(None, description="Timestamp when worker initiated inference")
    completed_at: Optional[datetime] = Field(None, description="Timestamp when job completed or failed")
    created_at: datetime = Field(..., description="Record insertion timestamp")
    updated_at: datetime = Field(..., description="Record update timestamp")

    model_config = ConfigDict(from_attributes=True)

class UsageLogBase(BaseModel):
    characters_count: int = Field(0, description="Text characters processed")
    audio_duration_seconds: float = Field(0.0, description="Seconds of audio generated")
    compute_ms: int = Field(0, description="CPU/GPU inference execution time in ms")

class UsageLogCreate(UsageLogBase):
    api_key_id: Optional[UUID] = Field(None, description="API key utilized")
    synthesis_job_id: Optional[UUID] = Field(None, description="Associated synthesis task ID")

class UsageLogResponse(UsageLogBase):
    id: UUID = Field(..., description="Unique log identifier")
    user_id: UUID = Field(..., description="Consumer user ID")
    api_key_id: Optional[UUID] = Field(None, description="API key utilized")
    synthesis_job_id: Optional[UUID] = Field(None, description="Associated synthesis task ID")
    created_at: datetime = Field(..., description="Consumption timestamp")

    model_config = ConfigDict(from_attributes=True)

class TelemetryMetricBase(BaseModel):
    job_id: str = Field(..., description="Job ID associated with the metric")
    metric_name: str = Field(..., description="Name of the metric")
    metric_value: float = Field(..., description="Value of the metric")
    labels: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metric labels")

class TelemetryMetricCreate(TelemetryMetricBase):
    pass

class TelemetryMetricResponse(TelemetryMetricBase):
    id: UUID = Field(..., description="Unique metric identifier")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)

class RTFMetrics(BaseModel):
    synthesis_time_s: float = Field(..., description="Wall-clock execution time for synthesis")
    audio_length_s: float = Field(..., description="Duration of generated audio")
    rtf: float = Field(..., description="Real-Time Factor (synthesis_time / audio_length)")
