import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Enum as SAEnum, Float,
)
from sqlalchemy.orm import relationship
from backend.database import Base


class TranscriptionStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class EncryptionAlgorithm(str, enum.Enum):
    aes_256_gcm = "aes_256_gcm"
    chacha20_poly1305 = "chacha20_poly1305"
    fernet = "fernet"


class STTModel(str, enum.Enum):
    whisper_small = "whisper-small"
    whisper_medium = "whisper-medium"
    whisper_large = "whisper-large"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transcriptions = relationship("Transcription", back_populates="owner")
    api_keys = relationship("APIKey", back_populates="owner")


class Transcription(Base):
    __tablename__ = "transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(512), nullable=False)
    original_text = Column(Text)
    encrypted_text = Column(Text)
    language = Column(String(10), default="en")
    duration_seconds = Column(Float)
    stt_model = Column(SAEnum(STTModel), default=STTModel.whisper_small)
    encryption_algorithm = Column(SAEnum(EncryptionAlgorithm), default=EncryptionAlgorithm.aes_256_gcm)
    status = Column(SAEnum(TranscriptionStatus), default=TranscriptionStatus.pending)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    owner = relationship("User", back_populates="transcriptions")


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime)

    owner = relationship("User", back_populates="api_keys")
