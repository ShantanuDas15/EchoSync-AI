from sqlalchemy.orm import Session
from app.db.base import UsageLog
from app.db.repositories.base import BaseRepository

class UsageLogRepository(BaseRepository[UsageLog]):
    def __init__(self, session: Session):
        super().__init__(UsageLog, session)
