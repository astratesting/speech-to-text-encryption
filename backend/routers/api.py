from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from backend.database import get_db
from backend.models import (
    Transcription, TranscriptionStatus, EncryptionAlgorithm, STTModel, User
)
from backend.services.auth_service import get_current_user
from backend.services.core import TranscriptionService

router = APIRouter()
svc = TranscriptionService()


class TranscriptionOut(BaseModel):
    id: int
    filename: str
    status: TranscriptionStatus
    stt_model: STTModel
    encryption_algorithm: EncryptionAlgorithm
    language: str | None
    duration_seconds: float | None
    created_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True


class TranscriptionDetail(TranscriptionOut):
    encrypted_text: str | None
    error_message: str | None


class DecryptRequest(BaseModel):
    transcription_id: int
    encryption_key: str


@router.post("/transcribe", response_model=TranscriptionOut, status_code=status.HTTP_202_ACCEPTED)
async def transcribe(
    file: UploadFile = File(...),
    stt_model: STTModel = Form(STTModel.whisper_small),
    encryption_algorithm: EncryptionAlgorithm = Form(EncryptionAlgorithm.aes_256_gcm),
    language: str = Form("en"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    audio_bytes = await file.read()
    record = await svc.transcribe_and_encrypt(
        db=db,
        user_id=current_user.id,
        filename=file.filename or "upload",
        audio_bytes=audio_bytes,
        stt_model=stt_model,
        encryption_algorithm=encryption_algorithm,
        language=language,
    )
    return record


@router.get("/transcriptions", response_model=List[TranscriptionOut])
def list_transcriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
):
    return (
        db.query(Transcription)
        .filter(Transcription.user_id == current_user.id)
        .order_by(Transcription.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/transcriptions/{transcription_id}", response_model=TranscriptionDetail)
def get_transcription(
    transcription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Transcription)
        .filter(
            Transcription.id == transcription_id,
            Transcription.user_id == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return record


@router.post("/decrypt")
def decrypt_transcription(
    payload: DecryptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Transcription)
        .filter(
            Transcription.id == payload.transcription_id,
            Transcription.user_id == current_user.id,
            Transcription.status == TranscriptionStatus.completed,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Transcription not found or not completed")

    try:
        plaintext = svc.decrypt_text(
            encrypted_text=record.encrypted_text,
            algorithm=record.encryption_algorithm,
            key=payload.encryption_key,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Decryption failed — invalid key")

    return {"transcription_id": record.id, "text": plaintext}


@router.delete("/transcriptions/{transcription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transcription(
    transcription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(Transcription)
        .filter(
            Transcription.id == transcription_id,
            Transcription.user_id == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Transcription not found")
    db.delete(record)
    db.commit()


@router.get("/models")
def list_models():
    return {
        "stt_models": [m.value for m in STTModel],
        "encryption_algorithms": [a.value for a in EncryptionAlgorithm],
    }
