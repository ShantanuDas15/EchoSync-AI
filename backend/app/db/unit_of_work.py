from sqlalchemy.orm import Session
from app.db.repositories.user_repo import UserRepository
from app.db.repositories.speaker_repo import SpeakerProfileRepository
from app.db.repositories.audio_repo import AudioAssetRepository
from app.db.repositories.job_repo import SynthesisJobRepository
from app.db.repositories.api_key_repo import ApiKeyRepository
from app.db.repositories.usage_repo import UsageLogRepository

class UnitOfWork:
    """Context-managed Unit of Work for atomic multi-repository transactions."""
    
    def __init__(self, session: Session):
        self.session = session
        self.users = UserRepository(self.session)
        self.speaker_profiles = SpeakerProfileRepository(self.session)
        self.audio_assets = AudioAssetRepository(self.session)
        self.jobs = SynthesisJobRepository(self.session)
        self.api_keys = ApiKeyRepository(self.session)
        self.usage_logs = UsageLogRepository(self.session)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        # Do not close the session here; session lifecycle should be handled by the caller/dependency injector.
            
    def commit(self):
        self.session.commit()
        
    def rollback(self):
        self.session.rollback()
