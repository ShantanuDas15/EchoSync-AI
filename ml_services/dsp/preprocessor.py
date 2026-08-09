"""
Core Audio DSP Preprocessing Engine.
Performs mono downmixing, 22.05 kHz resampling, -3 dBFS peak amplitude normalization,
silero-VAD silence trimming, and STFT 80-band log-mel spectrogram extraction.
"""

import io
import os
from typing import Tuple, Union
import numpy as np
import librosa
import soundfile as sf

from ml_services.dsp.vad import VoiceActivityDetector
from ml_services.dsp.filterbank import MelFilterbankProcessor, compute_mel_spectrogram


class AudioPreprocessor:
    """
    Main Audio Preprocessor enforcing EchoSync AI DSP contracts:
    1. Mono downmixing
    2. Resampling to target rate (22,050 Hz)
    3. Peak amplitude normalization to -3 dBFS
    4. Voice Activity Detection (VAD) silence trimming
    """

    TARGET_SAMPLE_RATE: int = 22050
    TARGET_DBFS: float = -3.0

    def __init__(self, target_sr: int = 22050, target_dbfs: float = -3.0, top_db: float = 30.0):
        """
        Initialize AudioPreprocessor with target specifications.

        Args:
            target_sr (int): Target sampling rate in Hz (default 22,050 Hz).
            target_dbfs (float): Target peak amplitude in dBFS (default -3.0 dBFS).
            top_db (float): Silence threshold for VAD in dB relative to peak (default 30.0 dB).
        """
        self.target_sr = target_sr
        self.target_dbfs = target_dbfs
        self.target_peak = 10.0 ** (target_dbfs / 20.0)  # ~0.70794578
        self.vad = VoiceActivityDetector(top_db=top_db)
        self.filterbank = MelFilterbankProcessor(sr=target_sr)

    def downmix_to_mono(self, y: np.ndarray) -> np.ndarray:
        """
        Converts stereo or multi-channel audio arrays to a single 1D mono waveform.

        Args:
            y (np.ndarray): Input audio array of shape (N,), (C, N), or (N, C).

        Returns:
            np.ndarray: 1D mono audio array of shape (N,).
        """
        if y.ndim == 1:
            return y.astype(np.float32)

        # Handle channel-first (C, N) vs channel-last (N, C)
        if y.shape[0] < y.shape[1] and y.shape[0] <= 8:
            # Channel-first format (C, N)
            mono = np.mean(y, axis=0)
        else:
            # Channel-last format (N, C)
            mono = np.mean(y, axis=1)

        return mono.astype(np.float32)

    def resample_audio(self, y: np.ndarray, orig_sr: int) -> np.ndarray:
        """
        Resamples input audio from orig_sr to target_sr (22,050 Hz).

        Args:
            y (np.ndarray): 1D mono audio waveform.
            orig_sr (int): Original sampling rate of the input audio.

        Returns:
            np.ndarray: Resampled 1D mono audio waveform at 22,050 Hz.
        """
        if orig_sr == self.target_sr:
            return y.astype(np.float32)

        resampled = librosa.resample(y, orig_sr=orig_sr, target_sr=self.target_sr)
        return resampled.astype(np.float32)

    def normalize_peak(self, y: np.ndarray) -> np.ndarray:
        """
        Normalizes peak amplitude of the audio array to target_dbfs (-3.0 dBFS).

        Args:
            y (np.ndarray): Input audio waveform.

        Returns:
            np.ndarray: Amplitude-normalized audio waveform.
        """
        peak = np.max(np.abs(y))
        if peak < 1e-7:
            return y.astype(np.float32)

        scaling_factor = self.target_peak / peak
        normalized = y * scaling_factor

        # Safety clip to ensure hard upper limit is strictly satisfied
        clipped = np.clip(normalized, -self.target_peak, self.target_peak)
        return clipped.astype(np.float32)

    def load_audio(
        self, audio_source: Union[str, bytes, np.ndarray], sr: int = None
    ) -> Tuple[np.ndarray, int]:
        """
        Loads audio from file path, bytes buffer, or raw array and returns (waveform, sr).

        Args:
            audio_source (Union[str, bytes, np.ndarray]): Input audio file path, raw bytes, or array.
            sr (int, optional): Original sampling rate if audio_source is a raw array.

        Returns:
            Tuple[np.ndarray, int]: Loaded audio array and its original sampling rate.
        """
        if isinstance(audio_source, str):
            y, orig_sr = sf.read(audio_source, dtype='float32')
            if y.ndim > 1:
                y = self.downmix_to_mono(y)
            return y, orig_sr

        elif isinstance(audio_source, bytes):
            buffer = io.BytesIO(audio_source)
            y, orig_sr = sf.read(buffer, dtype='float32')
            if y.ndim > 1:
                y = self.downmix_to_mono(y)
            return y, orig_sr

        elif isinstance(audio_source, np.ndarray):
            y = self.downmix_to_mono(audio_source)
            orig_sr = sr if sr is not None else self.target_sr
            return y, orig_sr

        else:
            raise ValueError(f"Unsupported audio source type: {type(audio_source)}")

    def process_audio(
        self, audio_source: Union[str, bytes, np.ndarray], sr: int = None, trim_silence: bool = True
    ) -> Tuple[np.ndarray, np.ndarray, int]:
        """
        Executes the complete DSP preprocessing pipeline:
        Load -> Mono Downmix -> Resample (22.05 kHz) -> VAD Silence Trim -> Peak Normalization (-3 dBFS) -> Mel-Filterbank.

        Args:
            audio_source (Union[str, bytes, np.ndarray]): Input audio source.
            sr (int, optional): Sampling rate if input is a raw array.
            trim_silence (bool): Whether to apply VAD silence trimming (default True).

        Returns:
            Tuple[np.ndarray, np.ndarray, int]:
                - Cleaned 1D float32 audio waveform (22,050 Hz, normalized to -3 dBFS).
                - Log-mel spectrogram array of shape (80, T_frames).
                - Target sampling rate (22,050 Hz).
        """
        # 1. Load & Mono Downmix
        raw_y, orig_sr = self.load_audio(audio_source, sr=sr)

        # 2. Resample to Target Sample Rate (22,050 Hz)
        y_22k = self.resample_audio(raw_y, orig_sr=orig_sr)

        # 3. Apply VAD Silence Trimming
        if trim_silence:
            y_trimmed = self.vad.trim_silence(y_22k, sr=self.target_sr)
        else:
            y_trimmed = y_22k

        # 4. Normalize Peak Amplitude to -3 dBFS
        y_normalized = self.normalize_peak(y_trimmed)

        # 5. Extract STFT 80-band Log-Mel Spectrogram
        mel_spec = self.filterbank.compute_mel_spectrogram(y_normalized, sr=self.target_sr)

        return y_normalized, mel_spec, self.target_sr
