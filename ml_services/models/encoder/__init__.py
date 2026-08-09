"""
Speaker Identity Encoder Submodule for EchoSync AI.
Exposes GE2ESpeakerEncoder and ResNetSpeakerEmbedder models.
"""

from ml_services.models.encoder.ge2e import GE2ESpeakerEncoder
from ml_services.models.encoder.ResNet_embedder import ResNetSpeakerEmbedder

__all__ = [
    "GE2ESpeakerEncoder",
    "ResNetSpeakerEmbedder",
]
