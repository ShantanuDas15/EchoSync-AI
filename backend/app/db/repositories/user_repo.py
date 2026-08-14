from sqlalchemy.orm import Session
from app.db.base import User
from app.db.repositories.base import BaseRepository
from sqlalchemy import select
from typing import Optional

class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        super().__init__(User, session)

    def get_by_sub(self, sub: str) -> Optional[User]:
        stmt = select(User).where(User.sub == sub)
        return self.session.scalars(stmt).first()
