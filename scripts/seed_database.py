import os
import sys
import math
import random
import logging

# Ensure backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.supabase_client import SupabaseVectorClient
from app.services.r2_storage import R2StorageClient

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def generate_dummy_vector(seed: int) -> list[float]:
    random.seed(seed)
    vec = [random.gauss(0, 1) for _ in range(256)]
    norm = math.sqrt(sum(v*v for v in vec))
    return [v / norm for v in vec]

def create_dummy_audio_file(filename: str):
    """Creates a dummy text file posing as a wav file to satisfy upload simulation."""
    with open(filename, 'w') as f:
        f.write("RIFF dummy WAV data")

def seed_services():
    logger.info("Initializing Supabase and R2 Storage clients...")
    supabase_client = SupabaseVectorClient()
    r2_client = R2StorageClient()
    
    logger.info("--- Testing Supabase Vector Storage ---")
    test_vector = generate_dummy_vector(42)
    
    # Verify insertion
    insert_res = supabase_client.insert_voice_vector("test_voice_42", test_vector, {"name": "Test Voice"})
    logger.info(f"Vector insertion result: {insert_res}")
    
    # Verify similarity search
    search_res = supabase_client.search_similar_voices(test_vector, limit=2)
    logger.info(f"Similarity search result: {search_res}")
    
    logger.info("--- Testing Cloudflare R2 Persistence ---")
    dummy_file = "test_artifact.wav"
    create_dummy_audio_file(dummy_file)
    
    try:
        # Verify file upload
        object_name = "test/test_artifact.wav"
        upload_success = r2_client.upload_file(dummy_file, object_name)
        logger.info(f"R2 upload success: {upload_success}")
        
        # Verify presigned URL generation (1 hour = 3600 seconds)
        presigned_url = r2_client.generate_presigned_url(object_name, expiration_seconds=3600)
        logger.info(f"Generated presigned URL: {presigned_url}")
    finally:
        if os.path.exists(dummy_file):
            os.remove(dummy_file)

    logger.info("Milestone 2.5 Seeding & Verification complete.")

if __name__ == "__main__":
    seed_services()
