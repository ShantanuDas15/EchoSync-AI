from sqlalchemy.orm import Session
from app.db.base import SynthesisJob
from app.db.repositories.base import BaseRepository
from typing import Optional

class SynthesisJobRepository(BaseRepository[SynthesisJob]):
    def __init__(self, session: Session):
        super().__init__(SynthesisJob, session)

    def transition_status(self, job: SynthesisJob, new_status: str, error_detail: Optional[dict] = None) -> SynthesisJob:
        valid_transitions = {
            'queued': ['processing', 'cancelled'],
            'processing': ['streaming', 'completed', 'failed'],
            'streaming': ['completed', 'failed']
        }
        if new_status not in valid_transitions.get(job.status, []):
            raise ValueError(f"Invalid transition from {job.status} to {new_status}")
        
        job.status = new_status
        if error_detail:
            job.error_detail = error_detail
            
        self.session.flush()
        return job
