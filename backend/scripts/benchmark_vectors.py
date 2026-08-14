import time
import threading
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base, SpeakerProfile, User
from app.db.repositories.speaker_repo import SpeakerProfileRepository
import random

# We'll benchmark against a file-backed SQLite for thread safety in testing
# In production, this runs against Postgres with pgvector
TEST_DATABASE_URL = "sqlite:///benchmark.db"

def generate_mock_embedding():
    return [random.random() for _ in range(128)]

def run_benchmark():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    
    # Preload data
    session = SessionLocal()
    user = User(sub="benchmark|1", email="bench@example.com")
    session.add(user)
    session.flush()
    
    # 50 mock speaker profiles
    profiles = []
    for i in range(50):
        profiles.append(SpeakerProfile(
            user_id=user.id,
            speaker_name=f"Speaker {i}",
            embedding=str(generate_mock_embedding()),
            visibility="public"
        ))
    session.add_all(profiles)
    session.commit()
    
    repo = SpeakerProfileRepository(session)
    
    queries = 500
    concurrency = 10
    results = []
    
    def worker():
        local_session = SessionLocal()
        local_repo = SpeakerProfileRepository(local_session)
        for _ in range(queries // concurrency):
            q_emb = generate_mock_embedding()
            start = time.time()
            local_repo.search_similar_voices(q_emb, limit=5)
            duration = time.time() - start
            results.append(duration)
        local_session.close()

    print("Starting vector search benchmark (Two-tier Caching + DB)...")
    start_time = time.time()
    
    threads = []
    for _ in range(concurrency):
        t = threading.Thread(target=worker)
        t.start()
        threads.append(t)
        
    for t in threads:
        t.join()
        
    total_time = time.time() - start_time
    qps = queries / total_time
    avg_latency = (sum(results) / len(results)) * 1000
    
    print(f"Total queries: {queries}")
    print(f"Total time: {total_time:.3f}s")
    print(f"QPS: {qps:.2f}")
    print(f"Average latency: {avg_latency:.2f}ms")
    
    assert qps > 100, f"QPS too low: {qps}"
    assert avg_latency < 50, f"Average latency too high: {avg_latency}ms"
    
    print("Benchmark PASSED!")
    
    Base.metadata.drop_all(engine)

if __name__ == "__main__":
    run_benchmark()
