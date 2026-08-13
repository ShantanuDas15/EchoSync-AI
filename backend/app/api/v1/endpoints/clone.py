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

    import uuid
    import hashlib
    from app.services.supabase_client import SupabaseVectorClient

    supabase = SupabaseVectorClient()
    
    # 1. Create audio_assets record
    audio_asset_id = str(uuid.uuid4())
    content_hash = hashlib.sha256(file_bytes).hexdigest()
    # Mock duration and sample rate for now
    duration_seconds = len(file_bytes) / (22050 * 2) 
    
    asset_data = {
        "id": audio_asset_id,
        "r2_object_key": f"reference/{audio_asset_id}{ext}",
        "file_name": filename,
        "content_hash": content_hash,
        "file_size_bytes": len(file_bytes),
        "duration_seconds": max(0.1, duration_seconds),
        "sample_rate": 22050,
        "is_reference_sample": True
    }
    try:
        supabase.insert_audio_asset(asset_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save reference audio metadata.")

    # 2. Extract 256-d embedding (mocked)
    dummy_embedding = [0.01] * 256
    
    # 3. Create speaker_profiles record
    voice_id = voice_name or f"voice-{uuid.uuid4().hex[:8]}"
    try:
        supabase.insert_voice_vector(
            voice_id=voice_id,
            vector=dummy_embedding,
            speaker_name=voice_id,
            reference_audio_id=audio_asset_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save voice profile.")

    # Dispatch task asynchronously
    task_id = task_dispatcher.dispatch_voice_cloning_task(
        file_bytes=file_bytes,
        filename=filename,
        text=cleaned_text,
        voice_name=voice_id,
    )
    
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
