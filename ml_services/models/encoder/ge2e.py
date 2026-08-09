"""
Generalized End-to-End (GE2E) Deep Speaker Encoder Engine.
Extracts 256-dimensional L2-normalized d-vector speaker identity embeddings
capturing pitch, formant contours, and vocal timbre characteristics.
"""

from typing import Union
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class GE2ESpeakerEncoder(nn.Module):
    """
    3-layer LSTM Generalized End-to-End (GE2E) Deep Speaker Encoder.
    Maps log-mel spectrogram frames to a 256-dimensional L2-normalized embedding vector.
    """

    def __init__(
        self,
        num_mels: int = 80,
        hidden_size: int = 256,
        embedding_dim: int = 256,
        num_layers: int = 3,
        dropout: float = 0.1
    ):
        """
        Initialize GE2E Speaker Encoder architecture.

        Args:
            num_mels (int): Input mel-spectrogram frequency channels (default 80).
            hidden_size (int): Hidden dimension size of LSTM layers (default 256).
            embedding_dim (int): Dimension of output d-vector embedding (default 256).
            num_layers (int): Number of stacked LSTM layers (default 3).
            dropout (float): Dropout probability between LSTM layers (default 0.1).
        """
        super().__init__()
        self.num_mels = num_mels
        self.hidden_size = hidden_size
        self.embedding_dim = embedding_dim
        self.num_layers = num_layers

        # 3-Layer Stacked LSTM Encoder
        self.lstm = nn.LSTM(
            input_size=num_mels,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )

        # Linear Projection Layer: (hidden_size -> embedding_dim)
        self.projection = nn.Linear(hidden_size, embedding_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass mapping input mel-spectrogram tensor to L2-normalized 256-d embeddings.

        Args:
            x (torch.Tensor): Log-mel spectrogram tensor. Acceptable shapes:
                              - (Batch, Frames, 80)
                              - (Batch, 80, Frames)
                              - (Frames, 80)

        Returns:
            torch.Tensor: L2-normalized speaker embedding tensor of shape (Batch, 256).
        """
        # Shape handling and normalization
        if x.ndim == 2:
            # (Frames, 80) -> (1, Frames, 80)
            if x.shape[0] == 80 and x.shape[1] != 80:
                x = x.transpose(0, 1)
            x = x.unsqueeze(0)
        elif x.ndim == 3:
            # If shape is (Batch, 80, Frames), transpose to (Batch, Frames, 80)
            if x.shape[1] == 80 and x.shape[2] != 80:
                x = x.transpose(1, 2)

        # Pass through 3-layer LSTM: output shape (Batch, Frames, hidden_size)
        lstm_out, (h_n, c_n) = self.lstm(x)

        # Extract last frame hidden state representation
        last_hidden = lstm_out[:, -1, :]  # (Batch, hidden_size)

        # Linear projection to embedding_dim (256)
        raw_embedding = self.projection(last_hidden)  # (Batch, 256)

        # Apply L2 Vector Normalization: ||e||_2 = 1.0
        normalized_embedding = F.normalize(raw_embedding, p=2, dim=-1, eps=1e-12)

        return normalized_embedding

    @torch.no_grad()
    def embed_utterance(
        self, mel_spectrogram: Union[np.ndarray, torch.Tensor], device: str = "cpu"
    ) -> np.ndarray:
        """
        Helper method to extract a normalized 1D 256-d speaker d-vector from a single utterance.

        Args:
            mel_spectrogram (Union[np.ndarray, torch.Tensor]): Log-mel spectrogram array/tensor.
            device (str): Execution device ('cpu' or 'cuda').

        Returns:
            np.ndarray: 1D float32 numpy array of shape (256,) with L2 norm equal to 1.0.
        """
        self.eval()
        if isinstance(mel_spectrogram, np.ndarray):
            mel_tensor = torch.from_numpy(mel_spectrogram).float().to(device)
        else:
            mel_tensor = mel_spectrogram.float().to(device)

        embedding_tensor = self.forward(mel_tensor)
        embedding_np = embedding_tensor.squeeze(0).cpu().numpy()

        # Re-verify L2 norm stability on NumPy array
        norm = np.linalg.norm(embedding_np)
        if norm > 1e-7:
            embedding_np = embedding_np / norm

        return embedding_np.astype(np.float32)

    @staticmethod
    def compute_similarity(e1: torch.Tensor, e2: torch.Tensor) -> torch.Tensor:
        """
        Computes cosine similarity matrix between two normalized speaker embedding tensors.

        Args:
            e1 (torch.Tensor): Speaker embedding tensor of shape (Batch_A, 256).
            e2 (torch.Tensor): Speaker embedding tensor of shape (Batch_B, 256).

        Returns:
            torch.Tensor: Cosine similarity score(s) bounded in [-1.0, 1.0].
        """
        e1_norm = F.normalize(e1, p=2, dim=-1)
        e2_norm = F.normalize(e2, p=2, dim=-1)
        return torch.mm(e1_norm, e2_norm.transpose(0, 1))
