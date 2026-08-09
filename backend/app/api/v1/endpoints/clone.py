from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status, Depends
from app.schemas.voice import VoiceCloneResponse, TaskStatusResponse
from app.services.task_dispatcher import task_dispatcher
from app.api.v1.deps import verify_api_key, get_settings
from app.core.config import Settings

router = APIRouter()

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".flac", ".mp3", ".ogg"}

@router.post(
    "/voice/clone",
    response_model=VoiceCloneResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Dispatch Zero-Shot Voice Cloning Task",
    description="Uploads reference speaker audio clip (.wav, .flac) and text prompt to synthesize cloned speech.",
    dependencies=[Depends(verify_api_key)],
)
async def clone_voice(
    file: UploadFile = File(..., description="Reference speaker audio sample (.wav, .flac, .mp3, .ogg)"),
    text: str = Form(..., min_length=1, max_length=5000, description="Target text payload to synthesize"),
    voice_name: str | None = Form(None, description="Optional custom name for cloned voice profile"),
    settings: Settings = Depends(get_settings),
):
    # Validate text payload
    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text payload must not be empty or whitespace.",
        )

    # Validate file extension
    filename = file.filename or "reference.wav"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}",
        )

    # Read audio file bytes & validate file size limit
    file_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded reference audio file is empty (0 bytes).",
        )
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Dispatch task asynchronously
    task_id = task_dispatcher.dispatch_voice_cloning_task(
        file_bytes=file_bytes,
        filename=filename,
        text=cleaned_text,
        voice_name=voice_name,
    )
    
    task_info = task_dispatcher.get_task_status(task_id)
    voice_id = task_info.get("voice_id", "voice-default") if task_info else "voice-default"

    return VoiceCloneResponse(
        task_id=task_id,
        status="queued",
        voice_id=voice_id,
        message="Voice cloning synthesis task queued successfully.",
    )

@router.get(
    "/voice/tasks/{task_id}",
    response_model=TaskStatusResponse,
    summary="Get Asynchronous Voice Cloning Task Status",
    dependencies=[Depends(verify_api_key)],
)
async def get_task_status(task_id: str):
    task_info = task_dispatcher.get_task_status(task_id)
    if not task_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found.",
        )
    
    return TaskStatusResponse(
        task_id=task_info["task_id"],
        status=task_info["status"],
        result=task_info.get("result"),
        error=task_info.get("error"),
    )
