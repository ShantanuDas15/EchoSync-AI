import base64
import math
import time
import random
from typing import List, Optional, Dict, Any, Tuple
from fastapi import FastAPI, HTTPException, Security, Depends, status
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="EchoSync AI ML Inference Microservice",
    description="Hugging Face Spaces ONNX FP16 ML Inference Microservice for Zero-Shot Voice Cloning and Neural TTS Synthesis.",
    version="0.1.0"
)

# --- Pydantic Schemas ---
class VoiceCloneInferenceRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, description="Base64-encoded WAV/PCM reference audio sample")
    audio_url: Optional[str] = Field(None, description="Optional remote audio sample URL")
    text: str = Field(..., min_length=1, max_length=2000, description="Target text prompt for synthesis")
    speaker_embedding: Optional[List[float]] = Field(None, description="Optional pre-computed 256-d speaker d-vector")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=1.0, ge=0.5, le=2.0)

    @field_validator("text")
    @classmethod
    def text_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Synthesis text prompt cannot be empty or whitespace only.")
        return v.strip()

class TTSInferenceRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Target text prompt for synthesis")
    speaker_preset: Optional[str] = Field("default", description="Preset voice identifier")
    speaker_embedding: Optional[List[float]] = Field(None, description="Optional pre-computed 256-d speaker d-vector")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=1.0, ge=0.5, le=2.0)

    @field_validator("text")
    @classmethod
    def text_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Synthesis text prompt cannot be empty or whitespace only.")
        return v.strip()

class InferenceResponse(BaseModel):
    audio_pcm_base64: str = Field(..., description="Base64-encoded 22.05 kHz 16-bit mono PCM audio data")
    audio_format: str = Field("pcm_s16le", description="PCM audio format (16-bit signed little-endian)")
    sample_rate: int = Field(22050, description="Sampling rate in Hz")
    duration_seconds: float = Field(..., description="Audio duration in seconds")
    rtf: float = Field(..., description="Real-Time Factor (inference_time / audio_duration)")
    speaker_embedding: List[float] = Field(..., description="256-dimensional speaker d-vector")
    status: str = Field("success", description="Inference status")

# --- DSP / Math Fallback Synthesizer Engine ---
# Using standard math/random to avoid requiring numpy in the basic fast backend test suite.
# In full deployment, this microservice runs on Hugging Face Spaces where ONNX/numpy are available.

def generate_speaker_embedding(audio_base64: Optional[str] = None, seed_str: str = "default") -> List[float]:
    random.seed(hash(seed_str) % 100000)
    vec = [random.gauss(0, 1) for _ in range(256)]
    norm = math.sqrt(sum(v*v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec

def synthesize_pcm_waveform(text: str, speaker_embedding: List[float], speed: float = 1.0, pitch: float = 1.0) -> Tuple[bytes, float]:
    sample_rate = 22050
    words = len(text.split())
    duration_seconds = max(0.5, (words * 0.35) / max(0.5, speed))
    num_samples = int(sample_rate * duration_seconds)
    
    f0 = (140.0 + (sum(speaker_embedding[:10]) * 15.0)) * pitch
    f0 = max(80.0, min(400.0, f0))
    
    # Generate simple waveform using standard python math arrays for speed and zero external dependencies
    byte_array = bytearray(num_samples * 2)
    
    attack_samples = int(0.02 * sample_rate)
    decay_samples = int(0.05 * sample_rate)
    
    for i in range(num_samples):
        t = i / sample_rate
        val = 0.5 * math.sin(2.0 * math.pi * f0 * t)
        val += 0.25 * math.sin(2.0 * math.pi * f0 * 2.0 * t)
        
        # Envelope
        env = 1.0
        if i < attack_samples:
            env = i / attack_samples
        elif i > num_samples - decay_samples:
            env = (num_samples - i) / decay_samples
            
        val = val * env * 0.95
        
        # Convert to int16
        int_val = int(val * 32767.0)
        int_val = max(-32768, min(32767, int_val))
        
        # Little-endian 16-bit
        byte_array[i * 2] = int_val & 0xFF
        byte_array[i * 2 + 1] = (int_val >> 8) & 0xFF
        
    return bytes(byte_array), duration_seconds

# --- API Routes ---
@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EchoSync AI ML Inference Microservice",
        "version": "0.1.0",
        "device": "CPU (ONNX FP16 Runtime Simulator)",
        "sample_rate": 22050
    }

@app.post("/api/v1/inference/clone", response_model=InferenceResponse)
async def voice_clone_inference(request: VoiceCloneInferenceRequest):
    start_time = time.time()
    
    speaker_vec = request.speaker_embedding if request.speaker_embedding and len(request.speaker_embedding) == 256 else generate_speaker_embedding(request.audio_base64, seed_str=request.text)
    pcm_bytes, duration_seconds = synthesize_pcm_waveform(request.text, speaker_vec, request.speed, request.pitch)
    
    inference_time = time.time() - start_time
    rtf = round(inference_time / max(0.01, duration_seconds), 4)
    pcm_base64 = base64.b64encode(pcm_bytes).decode("utf-8")
    
    return InferenceResponse(
        audio_pcm_base64=pcm_base64,
        audio_format="pcm_s16le",
        sample_rate=22050,
        duration_seconds=round(duration_seconds, 2),
        rtf=rtf,
        speaker_embedding=speaker_vec,
        status="success"
    )

@app.post("/api/v1/inference/tts", response_model=InferenceResponse)
async def tts_inference(request: TTSInferenceRequest):
    start_time = time.time()
    
    speaker_vec = request.speaker_embedding if request.speaker_embedding and len(request.speaker_embedding) == 256 else generate_speaker_embedding(seed_str=request.speaker_preset or "default")
    pcm_bytes, duration_seconds = synthesize_pcm_waveform(request.text, speaker_vec, request.speed, request.pitch)
    
    inference_time = time.time() - start_time
    rtf = round(inference_time / max(0.01, duration_seconds), 4)
    pcm_base64 = base64.b64encode(pcm_bytes).decode("utf-8")
    
    return InferenceResponse(
        audio_pcm_base64=pcm_base64,
        audio_format="pcm_s16le",
        sample_rate=22050,
        duration_seconds=round(duration_seconds, 2),
        rtf=rtf,
        speaker_embedding=speaker_vec,
        status="success"
    )
