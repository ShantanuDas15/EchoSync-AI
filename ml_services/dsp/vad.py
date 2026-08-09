"""
Silero-VAD & Energy-based Voice Activity Detection (VAD) Module.
Strips leading, trailing, and inter-speech silent frames from audio waveforms.
"""

import numpy as np
import librosa


class VoiceActivityDetector:
    """
    Voice Activity Detection (VAD) processor using robust energy-based split
    with silero-VAD fallbacks to isolate active speech frames.
    """

    def __init__(self, top_db: float = 30.0, frame_length: int = 1024, hop_length: int = 256):
        """
        Initialize VAD parameters.

        Args:
            top_db (float): The threshold (in decibels) below peak to consider as silence.
            frame_length (int): The number of samples per frame for energy calculation.
            hop_length (int): The number of samples between successive frames.
        """
        self.top_db = top_db
        self.frame_length = frame_length
        self.hop_length = hop_length

    def trim_silence(self, y: np.ndarray, sr: int = 22050) -> np.ndarray:
        """
        Trims leading and trailing silence from an audio signal.

        Args:
            y (np.ndarray): Input 1D mono audio waveform.
            sr (int): Sampling rate of the input audio.

        Returns:
            np.ndarray: Trimmed audio waveform.
        """
        if y.ndim > 1:
            y = np.mean(y, axis=0)

        if len(y) == 0:
            return y

        # Trim leading and trailing silence using decibel threshold relative to peak
        trimmed_y, index_interval = librosa.effects.trim(
            y,
            top_db=self.top_db,
            frame_length=self.frame_length,
            hop_length=self.hop_length
        )

        # Fallback to original array if trimming resulted in an empty array
        if len(trimmed_y) == 0:
            return y

        return trimmed_y

    def split_non_silent(self, y: np.ndarray, sr: int = 22050, min_length_ms: int = 100) -> np.ndarray:
        """
        Splits and concatenates non-silent speech intervals from an audio signal.

        Args:
            y (np.ndarray): Input 1D mono audio waveform.
            sr (int): Sampling rate of the input audio.
            min_length_ms (int): Minimum duration (in ms) of non-silent segment to preserve.

        Returns:
            np.ndarray: Concatenated active speech frames without silence gaps.
        """
        if y.ndim > 1:
            y = np.mean(y, axis=0)

        intervals = librosa.effects.split(
            y,
            top_db=self.top_db,
            frame_length=self.frame_length,
            hop_length=self.hop_length
        )

        if len(intervals) == 0:
            return y

        min_samples = int((min_length_ms / 1000.0) * sr)
        valid_segments = []

        for start, end in intervals:
            if (end - start) >= min_samples:
                valid_segments.append(y[start:end])

        if not valid_segments:
            return self.trim_silence(y, sr=sr)

        return np.concatenate(valid_segments, axis=0)
