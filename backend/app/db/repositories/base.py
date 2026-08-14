from typing import Generic, TypeVar, Type, Optional, List, Any, Sequence
from sqlalchemy.orm import Session
from sqlalchemy import select

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    """Generic base repository for basic CRUD operations."""
    
    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session

    def get_by_id(self, id: Any) -> Optional[ModelType]:
        stmt = select(self.model).filter_by(id=id)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.filter(self.model.deleted_at.is_(None))
        return self.session.scalars(stmt).first()

    def list(self, limit: int = 100, offset: int = 0) -> Sequence[ModelType]:
        stmt = select(self.model)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.filter(self.model.deleted_at.is_(None))
        stmt = stmt.offset(offset).limit(limit)
        return self.session.scalars(stmt).all()

    def create(self, **kwargs) -> ModelType:
        instance = self.model(**kwargs)
        self.session.add(instance)
        # Flush to get the ID generated without committing
        self.session.flush()
        return instance

    def update(self, instance: ModelType, **kwargs) -> ModelType:
        for key, value in kwargs.items():
            setattr(instance, key, value)
        self.session.flush()
        return instance

    def delete(self, instance: ModelType) -> None:
        self.session.delete(instance)
        self.session.flush()

    def soft_delete(self, instance: ModelType) -> None:
        """
        Soft deletes the instance by setting deleted_at timestamp.
        Also dispatches an asynchronous R2 deletion task if it's an AudioAsset.
        """
        if hasattr(instance, "deleted_at"):
            from datetime import datetime, timezone
            instance.deleted_at = datetime.now(timezone.utc)
            self.session.flush()
            
            # Integrate R2StorageService into the BaseRepository lifecycle
            if instance.__class__.__name__ == "AudioAsset":
                if hasattr(instance, "r2_object_key") and instance.r2_object_key:
                    from app.celery_app.tasks import delete_r2_file_task
                    delete_r2_file_task.delay(instance.r2_object_key)

    def bulk_create(self, instances: List[ModelType]) -> None:
        self.session.add_all(instances)
        self.session.flush()
