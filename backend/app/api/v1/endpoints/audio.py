from fastapi import APIRouter, Depends, HTTPException, status
from app.api.v1.deps import verify_api_key, get_db
from sqlalchemy.orm import Session
from app.db.repositories.audio_repo import AudioAssetRepository
from app.services.r2_storage import r2_service

router = APIRouter()

@router.get(
    "/audio/{asset_id}/stream-url",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get Presigned URL for Audio Asset",
    description="Generates a temporary pre-signed URL for secure edge playback of an audio asset (e.g. reference_audio_url).",
    dependencies=[Depends(verify_api_key)],
)
async def get_presigned_audio_url(
    asset_id: str,
    expires_in: int = 3600,
    db: Session = Depends(get_db)
):
    repo = AudioAssetRepository(db)
    asset = repo.get_by_id(asset_id)
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio asset not found."
        )
        
    if not asset.r2_object_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio asset does not have an associated R2 object key."
        )
        
    url = await r2_service.generate_presigned_url(asset.r2_object_key, expires_in)
    
    if not url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate secure playback URL."
        )
        
    return {"url": url, "expires_in": expires_in}
