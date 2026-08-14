from sqlalchemy.orm import Session
from app.db.base import SpeakerProfile
from app.db.repositories.base import BaseRepository
from sqlalchemy import select
from typing import Sequence

class SpeakerProfileRepository(BaseRepository[SpeakerProfile]):
    def __init__(self, session: Session):
        super().__init__(SpeakerProfile, session)
        
    def list_public_profiles(self) -> Sequence[SpeakerProfile]:
        stmt = select(SpeakerProfile).where(SpeakerProfile.visibility == 'public')
        return self.session.scalars(stmt).all()
