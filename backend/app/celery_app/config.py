import os
from app.core.config import settings

broker_url = settings.REDIS_URL
result_backend = settings.REDIS_URL

broker_transport_options = {
    'visibility_timeout': 3600,
    'max_retries': 3,
}

result_expires = 3600
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True
