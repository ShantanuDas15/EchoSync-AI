from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.voice import TTSGenerateRequest, TTSGenerateResponse
from app.services.task_dispatcher import task_dispatcher
from app.api.v1.deps import verify_api_key

router = APIRouter()

@router.post(
    "/tts/generate",
    response_model=TTSGenerateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Dispatch Direct Text-to-Speech Task",
    description="Synthesizes speech audio from text using an existing voice profile ID.",
    dependencies=[Depends(verify_api_key)],
)
async def generate_tts(request: TTSGenerateRequest):
    cleaned_text = request.text.strip()
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text payload must not be empty or whitespace.",
        )

    task_id = task_dispatcher.dispatch_tts_task(
        text=cleaned_text,
        voice_id=request.voice_id,
        speed=request.speed,
        pitch=request.pitch,
    )

    return TTSGenerateResponse(
        task_id=task_id,
        status="queued",
        message="Text-to-speech synthesis task queued successfully.",
    )
