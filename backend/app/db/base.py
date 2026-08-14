import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, BigInteger, Numeric, 
    DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint, Table, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

VariantJSONB = JSON().with_variant(JSONB, "postgresql")

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("api_quota_monthly >= 0", name="chk_users_api_quota"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sub = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    tier = Column(String(32), nullable=False, default="free")
    api_quota_monthly = Column(Integer, nullable=False, default=50000)
    is_active = Column(Boolean, nullable=False, default=True)
    metadata_ = Column("metadata", VariantJSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    speaker_profiles = relationship("SpeakerProfile", back_populates="user", cascade="all, delete-orphan")
    audio_assets = relationship("AudioAsset", back_populates="user")
    synthesis_jobs = relationship("SynthesisJob", back_populates="user")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")


class SpeakerProfile(Base):
    __tablename__ = "speaker_profiles"
    __table_args__ = (
        Index("idx_speaker_profiles_user_visibility", "user_id", "visibility", "is_active", postgresql_where="deleted_at IS NULL"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    speaker_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    gender = Column(String(32), nullable=False, default="unspecified")
    language_code = Column(String(10), nullable=False, default="en-US")
    embedding = Column(Text, nullable=False)  # Formatted as vector string or list
    reference_audio_id = Column(UUID(as_uuid=True), ForeignKey("audio_assets.id", ondelete="SET NULL"), nullable=True)
    reference_audio_url = Column(Text, nullable=True)
    visibility = Column(String(32), nullable=False, default="private")
    is_active = Column(Boolean, nullable=False, default=True)
    metadata_ = Column("metadata", VariantJSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="speaker_profiles")
    reference_audio = relationship("AudioAsset", foreign_keys=[reference_audio_id])


class AudioAsset(Base):
    __tablename__ = "audio_assets"
    __table_args__ = (
        Index("idx_audio_assets_content_hash", "content_hash"),
        CheckConstraint("file_size_bytes > 0", name="chk_audio_file_size"),
        CheckConstraint("duration_seconds > 0", name="chk_audio_duration"),
        CheckConstraint("sample_rate > 0", name="chk_audio_sample_rate"),
        CheckConstraint("channels IN (1, 2)", name="chk_audio_channels"),
        CheckConstraint("bit_depth IN (8, 16, 24, 32)", name="chk_audio_bit_depth"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    storage_bucket = Column(String(128), nullable=False, default="echosync-audio-vault")
    r2_object_key = Column(String(512), unique=True, nullable=False)
    file_name = Column(String(255), nullable=False)
    content_hash = Column(String(64), nullable=False)
    mime_type = Column(String(64), nullable=False, default="audio/wav")
    file_size_bytes = Column(BigInteger, nullable=False)
    duration_seconds = Column(Numeric(8, 3), nullable=False)
    sample_rate = Column(Integer, nullable=False, default=22050)
    channels = Column(Integer, nullable=False, default=1)
    bit_depth = Column(Integer, nullable=False, default=16)
    is_reference_sample = Column(Boolean, nullable=False, default=False)
    metadata_ = Column("metadata", VariantJSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audio_assets")


class SynthesisJob(Base):
    __tablename__ = "synthesis_jobs"
    __table_args__ = (
        Index("idx_synthesis_jobs_task_id", "task_id"),
        Index("idx_synthesis_jobs_user_status_created", "user_id", "status", "created_at"),
        CheckConstraint("speed_modifier BETWEEN 0.50 AND 2.00", name="chk_synthesis_speed"),
        CheckConstraint("pitch_modifier BETWEEN 0.50 AND 2.00", name="chk_synthesis_pitch"),
        CheckConstraint("energy_modifier BETWEEN 0.50 AND 2.00", name="chk_synthesis_energy"),
        CheckConstraint("real_time_factor >= 0", name="chk_synthesis_rtf"),
        CheckConstraint("ttfb_ms >= 0", name="chk_synthesis_ttfb"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(String(128), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    speaker_profile_id = Column(UUID(as_uuid=True), ForeignKey("speaker_profiles.id", ondelete="SET NULL"), nullable=True)
    prompt_text = Column(Text, nullable=False)
    phoneme_sequence = Column(Text, nullable=True)
    speed_modifier = Column(Numeric(3, 2), nullable=False, default=1.00)
    pitch_modifier = Column(Numeric(3, 2), nullable=False, default=1.00)
    energy_modifier = Column(Numeric(3, 2), nullable=False, default=1.00)
    acoustic_model = Column(String(64), nullable=False, default="fastspeech2_fp16")
    vocoder_model = Column(String(64), nullable=False, default="hifigan_fp16")
    status = Column(String(32), nullable=False, default="queued")
    output_audio_id = Column(UUID(as_uuid=True), ForeignKey("audio_assets.id", ondelete="SET NULL"), nullable=True)
    real_time_factor = Column(Numeric(6, 4), nullable=True)
    ttfb_ms = Column(Integer, nullable=True)
    worker_id = Column(String(128), nullable=True)
    execution_engine = Column(String(64), nullable=False, default="hf_cpu_onnx")
    error_detail = Column(VariantJSONB, nullable=True)
    queued_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="synthesis_jobs")
    speaker_profile = relationship("SpeakerProfile")
    output_audio = relationship("AudioAsset")


class ApiKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = (
        Index("idx_api_keys_key_hash", "key_hash", postgresql_where="status = 'active'"),
        CheckConstraint("rate_limit_per_minute > 0", name="chk_api_keys_rate_limit"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key_name = Column(String(128), nullable=False)
    key_prefix = Column(String(16), nullable=False)
    key_hash = Column(String(128), unique=True, nullable=False)
    scopes = Column(VariantJSONB, nullable=False, default=list)
    rate_limit_per_minute = Column(Integer, nullable=False, default=60)
    status = Column(String(32), nullable=False, default="active")
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="api_keys")


class UsageLog(Base):
    __tablename__ = "usage_logs"
    __table_args__ = (
        CheckConstraint("characters_count >= 0", name="chk_usage_characters"),
        CheckConstraint("audio_duration_seconds >= 0", name="chk_usage_duration"),
        CheckConstraint("compute_ms >= 0", name="chk_usage_compute"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True)
    synthesis_job_id = Column(UUID(as_uuid=True), ForeignKey("synthesis_jobs.id", ondelete="SET NULL"), nullable=True)
    characters_count = Column(Integer, nullable=False, default=0)
    audio_duration_seconds = Column(Numeric(8, 3), nullable=False, default=0.000)
    compute_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class TelemetryMetric(Base):
    __tablename__ = "telemetry_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(String(128), nullable=True)
    metric_name = Column(String(128), nullable=False)
    metric_value = Column(Numeric, nullable=False)
    labels = Column(VariantJSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
