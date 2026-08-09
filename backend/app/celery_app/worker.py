from celery import Celery
from app.celery_app import config

celery_app = Celery("echosync_tasks")
celery_app.config_from_object(config)
celery_app.autodiscover_tasks(["app.celery_app"], related_name="tasks")

celery_app.conf.update(
    worker_concurrency=2,
    worker_prefetch_multiplier=1,
)
