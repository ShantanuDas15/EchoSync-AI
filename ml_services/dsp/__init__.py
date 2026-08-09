"""
Audio Digital Signal Processing (DSP) Module for EchoSync AI.
Exposes AudioPreprocessor, VoiceActivityDetector, and MelFilterbankProcessor.
"""

from ml_services.dsp.preprocessor import AudioPreprocessor
from ml_services.dsp.vad import VoiceActivityDetector
from ml_services.dsp.filterbank import MelFilterbankProcessor, compute_mel_spectrogram

__all__ = [
    "AudioPreprocessor",
    "VoiceActivityDetector",
    "MelFilterbankProcessor",
    "compute_mel_spectrogram",
]
