from sqlalchemy.orm import Session
from app.db.base import ApiKey
from app.db.repositories.base import BaseRepository
from sqlalchemy import select
from typing import Optional

class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self, session: Session):
        super().__init__(ApiKey, session)
        
    def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        stmt = select(ApiKey).where(ApiKey.key_hash == key_hash)
        return self.session.scalars(stmt).first()
