"""
ResNet 2D Convolutional Speaker Embedding Fallback Architecture.
Extracts 256-dimensional L2-normalized d-vector speaker identity embeddings.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ResidualBlock2D(nn.Module):
    """Basic 2D Residual Block for spectro-temporal feature extraction."""

    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        out += residual
        return self.relu(out)


class ResNetSpeakerEmbedder(nn.Module):
    """
    2D Convolutional ResNet Speaker Embedder.
    Maps log-mel spectrogram frames to a 256-dimensional L2-normalized embedding vector.
    """

    def __init__(self, in_channels: int = 1, embedding_dim: int = 256):
        """
        Initialize ResNet Speaker Embedder.

        Args:
            in_channels (int): Input audio spectrogram channels (default 1).
            embedding_dim (int): Output d-vector embedding dimension (default 256).
        """
        super().__init__()
        self.embedding_dim = embedding_dim

        # Initial Stem Convolution
        self.conv_stem = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True)
        )

        # Residual Layers
        self.layer1 = ResidualBlock2D(32)
        self.layer2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            ResidualBlock2D(64)
        )
        self.layer3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            ResidualBlock2D(128)
        )

        # Global Pooling and Linear Projection
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.projection = nn.Linear(128, embedding_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass mapping input mel-spectrogram to 256-d L2-normalized embedding.

        Args:
            x (torch.Tensor): Tensor of shape (Batch, 80, Frames) or (Batch, 1, 80, Frames)
                              or (Batch, Frames, 80).

        Returns:
            torch.Tensor: L2-normalized embedding tensor of shape (Batch, 256).
        """
        # Ensure 4D tensor (Batch, Channels, Height/Mels, Width/Frames)
        if x.ndim == 2:
            # (Frames, 80) -> (1, 1, 80, Frames)
            x = x.transpose(0, 1).unsqueeze(0).unsqueeze(0)
        elif x.ndim == 3:
            if x.shape[1] == 80:
                # (Batch, 80, Frames) -> (Batch, 1, 80, Frames)
                x = x.unsqueeze(1)
            else:
                # (Batch, Frames, 80) -> (Batch, 1, 80, Frames)
                x = x.transpose(1, 2).unsqueeze(1)

        out = self.conv_stem(x)
        out = self.layer1(out)
        out = self.layer2(out)
        out = self.layer3(out)

        out = self.global_pool(out)  # (Batch, 128, 1, 1)
        out = out.view(out.size(0), -1)  # (Batch, 128)
        raw_embedding = self.projection(out)  # (Batch, 256)

        # Apply L2 normalization: ||e||_2 = 1.0
        normalized_embedding = F.normalize(raw_embedding, p=2, dim=-1, eps=1e-12)
        return normalized_embedding
