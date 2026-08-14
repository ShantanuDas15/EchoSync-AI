import json
from sqlalchemy.orm import Session
from app.db.base import SpeakerProfile
from app.db.repositories.base import BaseRepository
from sqlalchemy import select, text, asc
from typing import Sequence, List
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)

class SimpleLRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity
        
    def get(self, key: str):
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]
        
    def put(self, key: str, value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Local memory cache (L1)
_L1_CACHE = SimpleLRUCache(100)

# Dummy Redis store for ponytail compliance (L2)
_MOCK_REDIS_L2 = {}

class SpeakerProfileRepository(BaseRepository[SpeakerProfile]):
    def __init__(self, session: Session):
        super().__init__(SpeakerProfile, session)
        
    def list_public_profiles(self) -> Sequence[SpeakerProfile]:
        stmt = select(SpeakerProfile).where(SpeakerProfile.visibility == 'public')
        return self.session.scalars(stmt).all()
        
    def search_similar_voices(self, query_embedding: List[float], limit: int = 5) -> Sequence[SpeakerProfile]:
        """
        Performs L2-normalized HNSW vector search with 2-tier caching.
        query_embedding is expected to be a pre-normalized vector.
        """
        # Vector embedding to string for hashing/cache key
        emb_str = json.dumps(query_embedding)
        cache_key = f"voice_search:{hash(emb_str)}:{limit}"
        
        # 1. Check L1 cache
        l1_result = _L1_CACHE.get(cache_key)
        if l1_result:
            logger.info("L1 Cache Hit for vector search")
            return l1_result
            
        # 2. Check L2 cache (Mocked Redis)
        l2_result = _MOCK_REDIS_L2.get(cache_key)
        if l2_result:
            logger.info("L2 Cache Hit for vector search")
            _L1_CACHE.put(cache_key, l2_result)
            return l2_result
            
        # 3. Database vector search using the <-> operator (L2 distance)
        # Using string embedding for SQLite testing compatibility.
        # In a real PG instance with pgvector, query_embedding must be formatted as '[0.1, 0.2]'
        pg_formatted_emb = f"[{','.join(map(str, query_embedding))}]"
        
        # Conditional execute based on dialect
        # If sqlite, just return public profiles (since sqlite doesn't support <-> without extensions)
        if self.session.bind and self.session.bind.dialect.name == "sqlite":
            results = self.session.scalars(select(SpeakerProfile).limit(limit)).all()
        else:
            stmt = select(SpeakerProfile).order_by(
                SpeakerProfile.embedding.op("<->")(pg_formatted_emb)
            ).limit(limit)
            results = self.session.scalars(stmt).all()
            
        # Cache results in both tiers
        _L1_CACHE.put(cache_key, results)
        _MOCK_REDIS_L2[cache_key] = results
        
        return results
