"""
STFT Mel-Filterbank Spectrogram Processing Engine.
Computes 80-band log-mel spectrogram frames from continuous 22.05 kHz time-domain waveforms.
"""

import numpy as np
import librosa


class MelFilterbankProcessor:
    """
    STFT Mel-Filterbank spectrogram processor converting time-domain waveforms
    into log-compressed 80-band mel-spectrogram feature frames.
    """

    def __init__(
        self,
        sr: int = 22050,
        n_fft: int = 1024,
        hop_length: int = 256,
        win_length: int = 1024,
        n_mels: int = 80,
        fmin: float = 0.0,
        fmax: float = 8000.0,
        eps: float = 1e-5
    ):
        """
        Initialize STFT Mel-Filterbank parameters matching acoustic model specifications.

        Args:
            sr (int): Target sampling rate (default 22,050 Hz).
            n_fft (int): FFT window size (default 1024).
            hop_length (int): Hop length between frames (default 256).
            win_length (int): STFT window length (default 1024).
            n_mels (int): Number of mel filterbank channels (default 80).
            fmin (float): Minimum frequency in Hz (default 0.0).
            fmax (float): Maximum frequency in Hz (default 8000.0).
            eps (float): Numerical stability epsilon for log compression (default 1e-5).
        """
        self.sr = sr
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.win_length = win_length
        self.n_mels = n_mels
        self.fmin = fmin
        self.fmax = fmax
        self.eps = eps

    def compute_mel_spectrogram(self, y: np.ndarray, sr: int = None) -> np.ndarray:
        """
        Computes 80-band log-mel spectrogram tensor with shape (80, T_frames).

        Args:
            y (np.ndarray): 1D mono float32 time-domain PCM audio array.
            sr (int, optional): Sample rate of the audio array. Defaults to self.sr.

        Returns:
            np.ndarray: Log-mel spectrogram array of shape (80, T_frames).
        """
        sample_rate = sr if sr is not None else self.sr

        if y.ndim > 1:
            y = np.mean(y, axis=0)

        # Pad audio to guarantee non-zero frame count for short inputs
        if len(y) < self.n_fft:
            y = np.pad(y, (0, self.n_fft - len(y)), mode='constant')

        # Compute STFT Mel-Spectrogram
        mel_spec = librosa.feature.melspectrogram(
            y=y,
            sr=sample_rate,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            win_length=self.win_length,
            n_mels=self.n_mels,
            fmin=self.fmin,
            fmax=self.fmax,
            power=1.0  # Linear magnitude
        )

        # Apply log dynamic range compression: log(mel + eps)
        log_mel_spec = np.log(np.maximum(mel_spec, self.eps))

        return log_mel_spec.astype(np.float32)


def compute_mel_spectrogram(y: np.ndarray, sr: int = 22050) -> np.ndarray:
    """
    Helper function to compute 80-band log-mel spectrogram using default settings.

    Args:
        y (np.ndarray): Input mono audio waveform.
        sr (int): Sampling rate (default 22,050 Hz).

    Returns:
        np.ndarray: Log-mel spectrogram array with shape (80, T_frames).
    """
    processor = MelFilterbankProcessor(sr=sr)
    return processor.compute_mel_spectrogram(y, sr=sr)
