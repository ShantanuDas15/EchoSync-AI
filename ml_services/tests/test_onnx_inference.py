import pytest
import torch
import time
import numpy as np
from ml_services.models.acoustic.fastspeech2 import FastSpeech2
from ml_services.models.vocoder.hifi_gan import HiFiGANGenerator
from ml_services.models.vocoder.sliding_window import SlidingWindowVocoderChunker

def test_inference_and_rtf():
    # Model initialization
    fastspeech2 = FastSpeech2()
    vocoder = HiFiGANGenerator()
    
    # Mock inputs
    text = "Hello world, this is a test of the EchoSync AI synthesis pipeline."
    speaker_emb = torch.randn(1, 256)
    
    # Force L2 norm = 1.0 just to be safe
    speaker_emb = speaker_emb / torch.norm(speaker_emb, p=2, dim=1, keepdim=True)
    
    # Inference timing
    start_time = time.time()
    
    # Acoustic model forward pass
    with torch.no_grad():
        mel = fastspeech2([text], speaker_emb)
        wav = vocoder.synthesize_pcm(mel)
        
    synthesis_time = time.time() - start_time
    
    # Output constraints
    assert wav.ndim == 1, "Vocoder output must be 1D time-domain PCM"
    assert wav.dtype == np.int16, "Vocoder output must be 16-bit PCM"
    assert not np.isnan(wav).any(), "Vocoder output must have zero NaN values"
    assert not np.isinf(wav).any(), "Vocoder output must have zero Inf values"
    
    # RTF calculation
    sample_rate = 22050
    generated_audio_length_s = max(len(wav) / sample_rate, 0.0001)
    
    rtf = synthesis_time / generated_audio_length_s
    print(f"Synthesis Time: {synthesis_time:.4f}s, Audio Length: {generated_audio_length_s:.4f}s")
    print(f"RTF: {rtf:.4f}")
    
    # The models are very small, so RTF < 0.35 should easily pass on CPU
    assert rtf < 0.35, f"Real-Time Factor (RTF) must be < 0.35, got {rtf:.4f}"

def test_sliding_window_chunker():
    chunker = SlidingWindowVocoderChunker(sample_rate=22050, window_duration_ms=50, crossfade_duration_ms=10)
    
    # 50ms = 1102 samples
    chunk1 = np.ones(1102, dtype=np.float32)
    chunk2 = np.ones(1102, dtype=np.float32) * 2
    
    out1 = chunker.process_chunk(chunk1)
    out2 = chunker.process_chunk(chunk2)
    
    assert out1.dtype == np.float32
    assert out2.dtype == np.float32
    # Ensure there is no shape crash
    assert len(out1) < len(chunk1)
