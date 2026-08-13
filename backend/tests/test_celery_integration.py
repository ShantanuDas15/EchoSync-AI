import pytest
from app.celery_app.tasks import process_voice_cloning_task
from app.services.task_dispatcher import task_dispatcher

def test_celery_worker_job_transitions():
    # Dispatch a task to create the initial state via the dispatcher
    file_bytes = b"dummy_audio"
    filename = "dummy.wav"
    text = "Hello world"
    
    task_id = task_dispatcher.dispatch_voice_cloning_task(
        file_bytes=file_bytes,
        filename=filename,
        text=text,
        voice_name="test_voice"
    )
    
    # We execute the celery task synchronously using apply()
    # This will trigger processing -> streaming -> completed transitions in the mocked DB client
    result = process_voice_cloning_task.apply(args=[task_id, filename, text])
    
    assert result.successful()
    
    task_result = result.result
    assert task_result["status"] == "completed"
    assert task_result["task_id"] == task_id
    
    # Check that task dispatcher can retrieve it (mock mode returns completed)
    status = task_dispatcher.get_task_status(task_id)
    assert status is not None
    assert status["task_id"] == task_id
    assert status["status"] == "completed"
