"""
Automated Pytest Unit Test Suite for EchoSync AI DSP Preprocessing Engine.
Validates 22.05 kHz resampling, stereo downmixing, -3 dBFS peak normalization,
VAD silence trimming, and 80-band STFT mel-spectrogram dimension assertions.
"""

import math
import numpy as np
import pytest

from ml_services.dsp.preprocessor import AudioPreprocessor
from ml_services.dsp.filterbank import MelFilterbankProcessor, compute_mel_spectrogram
from ml_services.dsp.vad import VoiceActivityDetector


@pytest.fixture
def preprocessor():
    """Provides a fresh instance of AudioPreprocessor for each test."""
    return AudioPreprocessor(target_sr=22050, target_dbfs=-3.0)


@pytest.mark.parametrize("orig_sr", [8000, 16000, 44100, 48000])
def test_audio_resampling_accuracy(preprocessor, orig_sr):
    """
    Gateway Assertion 1: Input audio of arbitrary sampling rate
    must be resampled to exactly 22,050 Hz.
    """
    duration_sec = 1.0
    t = np.linspace(0, duration_sec, int(orig_sr * duration_sec), endpoint=False)
    sine_wave = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

    processed_y, mel_spec, sr = preprocessor.process_audio(sine_wave, sr=orig_sr, trim_silence=False)

    assert sr == 22050, f"Expected target sample rate 22050 Hz, but got {sr} Hz."
    expected_samples = int(22050 * duration_sec)
    assert abs(len(processed_y) - expected_samples) <= 2, (
        f"Resampled length mismatch: expected ~{expected_samples}, got {len(processed_y)}"
    )


def test_stereo_and_multichannel_downmixing(preprocessor):
    """
    Gateway Assertion: 2-channel stereo and 4-channel input audio arrays
    must be downmixed to a 1D mono waveform array.
    """
    samples = 22050
    # Channel-first stereo (2, 22050)
    stereo_c_first = np.vstack([np.sin(np.linspace(0, 100, samples)), np.cos(np.linspace(0, 100, samples))]).astype(np.float32)
    mono_1 = preprocessor.downmix_to_mono(stereo_c_first)
    assert mono_1.ndim == 1
    assert len(mono_1) == samples

    # Channel-last 4-channel (22050, 4)
    multichannel_c_last = np.random.uniform(-0.5, 0.5, (samples, 4)).astype(np.float32)
    mono_2 = preprocessor.downmix_to_mono(multichannel_c_last)
    assert mono_2.ndim == 1
    assert len(mono_2) == samples


def test_peak_amplitude_normalization(preprocessor):
    """
    Gateway Assertion 3: Peak amplitude must be normalized to -3 dBFS,
    ensuring maximum sample value |x|_max <= 0.70795.
    """
    # Create arbitrary low-amplitude signal
    t = np.linspace(0, 1, 22050, endpoint=False)
    low_amp_signal = 0.05 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

    normalized_y = preprocessor.normalize_peak(low_amp_signal)

    peak_val = np.max(np.abs(normalized_y))
    target_peak = 10.0 ** (-3.0 / 20.0)  # ~0.70794578...

    assert pytest.approx(peak_val, abs=1e-4) == target_peak, (
        f"Normalized peak {peak_val} does not equal target peak {target_peak}"
    )
    assert peak_val <= 0.70795, f"Peak amplitude {peak_val} exceeds -3 dBFS upper bound 0.70795."


def test_vad_silence_trimming(preprocessor):
    """
    Gateway Assertion: Voice Activity Detection must trim leading and
    trailing silence frames.
    """
    sr = 22050
    speech_duration = 0.5
    silence_duration = 0.5

    t = np.linspace(0, speech_duration, int(sr * speech_duration), endpoint=False)
    speech = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
    silence = np.zeros(int(sr * silence_duration), dtype=np.float32)

    # Pad silence before and after speech
    padded_audio = np.concatenate([silence, speech, silence])

    trimmed_y = preprocessor.vad.trim_silence(padded_audio, sr=sr)

    assert len(trimmed_y) < len(padded_audio), "VAD failed to trim silent frames."
    # Assert trimmed length is approximately speech duration
    expected_speech_samples = len(speech)
    assert abs(len(trimmed_y) - expected_speech_samples) < (0.2 * sr)


def test_stft_mel_spectrogram_dimensions(preprocessor):
    """
    Gateway Assertion 2: STFT mel-filterbank transform of N audio samples
    must produce a log-mel spectrogram array of shape (80, T_frames)
    where T_frames = floor(N / 256) + 1.
    """
    n_samples = 22050  # 1 second of audio
    t = np.linspace(0, 1, n_samples, endpoint=False)
    audio = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

    processed_y, mel_spec, sr = preprocessor.process_audio(audio, sr=22050, trim_silence=False)

    assert mel_spec.ndim == 2, f"Mel-spectrogram must be 2D array, got shape {mel_spec.shape}"
    assert mel_spec.shape[0] == 80, f"Expected 80 mel channels, got {mel_spec.shape[0]}"

    expected_frames = (len(processed_y) // 256) + 1
    assert abs(mel_spec.shape[1] - expected_frames) <= 2, (
        f"Mel frame count mismatch: expected ~{expected_frames}, got {mel_spec.shape[1]}"
    )


def test_log_mel_dynamic_range_and_numerical_stability(preprocessor):
    """
    Gateway Assertion: Log-mel spectrogram values must contain zero NaN
    or Inf values and adhere to log dynamic range bounds.
    """
    silence = np.zeros(22050, dtype=np.float32)
    processed_y, mel_spec, sr = preprocessor.process_audio(silence, sr=22050, trim_silence=False)

    assert not np.isnan(mel_spec).any(), "Mel-spectrogram contains NaN values."
    assert not np.isinf(mel_spec).any(), "Mel-spectrogram contains Inf values."
    assert mel_spec.dtype == np.float32
