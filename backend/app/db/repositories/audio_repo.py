from sqlalchemy.orm import Session
from app.db.base import AudioAsset
from app.db.repositories.base import BaseRepository
from sqlalchemy import select
from typing import Optional

class AudioAssetRepository(BaseRepository[AudioAsset]):
    def __init__(self, session: Session):
        super().__init__(AudioAsset, session)
        
    def get_by_hash(self, content_hash: str) -> Optional[AudioAsset]:
        stmt = select(AudioAsset).where(AudioAsset.content_hash == content_hash)
        return self.session.scalars(stmt).first()
