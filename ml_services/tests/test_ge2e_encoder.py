"""
Automated Pytest Unit Test Suite for GE2E Speaker Encoder Pipeline.
Validates 256-dimensional output tensor shape, L2 vector norm equality to 1.0,
ResNet embedder fallback performance, and cosine similarity properties.
"""

import numpy as np
import pytest
import torch

from ml_services.models.encoder.ge2e import GE2ESpeakerEncoder
from ml_services.models.encoder.ResNet_embedder import ResNetSpeakerEmbedder


@pytest.fixture
def ge2e_encoder():
    """Provides a initialized GE2ESpeakerEncoder instance."""
    model = GE2ESpeakerEncoder(num_mels=80, hidden_size=256, embedding_dim=256, num_layers=3)
    model.eval()
    return model


@pytest.fixture
def resnet_embedder():
    """Provides an initialized ResNetSpeakerEmbedder instance."""
    model = ResNetSpeakerEmbedder(in_channels=1, embedding_dim=256)
    model.eval()
    return model


def test_ge2e_embedding_vector_shape_and_l2_norm(ge2e_encoder):
    """
    Gateway Assertion: Forward pass of mel-spectrogram tensor must produce 2D tensor of shape (Batch, 256),
    and Euclidean norm must evaluate to 1.0 +- 1e-5.
    """
    batch_size = 4
    frames = 128
    mels = 80

    # Input mel-spectrogram: (Batch, Frames, 80)
    mel_tensor = torch.randn(batch_size, frames, mels)

    with torch.no_grad():
        embedding = ge2e_encoder(mel_tensor)

    # 1. Assert shape is (4, 256)
    assert embedding.ndim == 2, f"Expected 2D embedding tensor, got {embedding.ndim}D"
    assert embedding.shape == (batch_size, 256), f"Expected shape ({batch_size}, 256), got {embedding.shape}"

    # 2. Assert L2 norm for every item in batch equals 1.0
    norms = torch.norm(embedding, p=2, dim=-1)
    for i, norm_val in enumerate(norms.tolist()):
        assert pytest.approx(norm_val, abs=1e-4) == 1.0, (
            f"Batch index {i}: Euclidean norm {norm_val} does not equal 1.0"
        )


def test_ge2e_flexible_input_shapes(ge2e_encoder):
    """
    Gateway Assertion: Encoder handles 2D (Frames, 80) and 3D (Batch, 80, Frames) input shapes.
    """
    frames = 100
    mels = 80

    # Test 2D input: (Frames, 80)
    mel_2d = torch.randn(frames, mels)
    with torch.no_grad():
        emb_2d = ge2e_encoder(mel_2d)
    assert emb_2d.shape == (1, 256)
    assert pytest.approx(torch.norm(emb_2d, p=2).item(), abs=1e-4) == 1.0

    # Test transposed 3D input: (Batch=2, 80, Frames)
    mel_3d_transposed = torch.randn(2, mels, frames)
    with torch.no_grad():
        emb_3d = ge2e_encoder(mel_3d_transposed)
    assert emb_3d.shape == (2, 256)
    assert pytest.approx(torch.norm(emb_3d[0], p=2).item(), abs=1e-4) == 1.0


def test_ge2e_embed_utterance_numpy_helper(ge2e_encoder):
    """
    Gateway Assertion: embed_utterance helper converts NumPy array to 1D float32 array
    of shape (256,) with L2 norm equal to 1.0.
    """
    frames = 80
    mels = 80
    mel_np = np.random.randn(frames, mels).astype(np.float32)

    embedding_np = ge2e_encoder.embed_utterance(mel_np)

    assert isinstance(embedding_np, np.ndarray), "Returned embedding must be a NumPy array."
    assert embedding_np.shape == (256,), f"Expected shape (256,), got {embedding_np.shape}"
    assert embedding_np.dtype == np.float32

    norm_val = np.linalg.norm(embedding_np)
    assert pytest.approx(norm_val, abs=1e-4) == 1.0, f"NumPy embedding L2 norm {norm_val} != 1.0"


def test_ge2e_cosine_similarity(ge2e_encoder):
    """
    Gateway Assertion: Cosine similarity helper computes valid similarity matrix bounded in [-1.0, 1.0].
    """
    e1 = torch.randn(2, 256)
    e2 = torch.randn(3, 256)

    sim_matrix = ge2e_encoder.compute_similarity(e1, e2)

    assert sim_matrix.shape == (2, 3), f"Expected similarity shape (2, 3), got {sim_matrix.shape}"
    assert (sim_matrix >= -1.0 - 1e-4).all() and (sim_matrix <= 1.0 + 1e-4).all(), (
        "Cosine similarity values must lie within range [-1.0, 1.0]."
    )


def test_resnet_speaker_embedder_shape_and_norm(resnet_embedder):
    """
    Gateway Assertion: ResNet embedder fallback produces (Batch, 256) tensor with ||e||_2 = 1.0.
    """
    batch_size = 3
    frames = 96
    mels = 80

    mel_tensor = torch.randn(batch_size, mels, frames)

    with torch.no_grad():
        embedding = resnet_embedder(mel_tensor)

    assert embedding.shape == (batch_size, 256)
    norms = torch.norm(embedding, p=2, dim=-1)
    for norm_val in norms.tolist():
        assert pytest.approx(norm_val, abs=1e-4) == 1.0
