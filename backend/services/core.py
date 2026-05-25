import os
import base64
import hashlib
import tempfile
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.fernet import Fernet
from backend.models import Transcription, TranscriptionStatus, EncryptionAlgorithm, STTModel

try:
    import whisper as openai_whisper  # type: ignore
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

_MODEL_CACHE: dict = {}


def _load_whisper_model(model_name: str):
    if model_name not in _MODEL_CACHE:
        _MODEL_CACHE[model_name] = openai_whisper.load_model(model_name.replace("whisper-", ""))
    return _MODEL_CACHE[model_name]


def _derive_key(raw_key: str, length: int = 32) -> bytes:
    return hashlib.sha256(raw_key.encode()).digest()[:length]


class TranscriptionService:
    def _run_whisper(self, audio_bytes: bytes, model_name: str, language: str) -> tuple[str, float]:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            model = _load_whisper_model(model_name)
            result = model.transcribe(tmp_path, language=language)
            text = result.get("text", "").strip()
            duration = result.get("segments", [{}])[-1].get("end", 0.0) if result.get("segments") else 0.0
            return text, float(duration)
        finally:
            os.unlink(tmp_path)

    def _stub_transcribe(self, audio_bytes: bytes) -> tuple[str, float]:
        # Used when Whisper is not installed (dev/test mode)
        size_kb = len(audio_bytes) / 1024
        return f"[STUB] Transcription of {size_kb:.1f}KB audio file", size_kb / 10

    def encrypt_text(self, text: str, algorithm: EncryptionAlgorithm, key: Optional[str] = None) -> tuple[str, str]:
        """Returns (encrypted_b64, key_used)."""
        if algorithm == EncryptionAlgorithm.fernet:
            fernet_key = Fernet.generate_key()
            f = Fernet(fernet_key)
            encrypted = f.encrypt(text.encode())
            return base64.b64encode(encrypted).decode(), fernet_key.decode()

        raw_key = key or base64.b64encode(os.urandom(32)).decode()
        derived = _derive_key(raw_key)

        if algorithm == EncryptionAlgorithm.aes_256_gcm:
            nonce = os.urandom(12)
            aesgcm = AESGCM(derived)
            ct = aesgcm.encrypt(nonce, text.encode(), None)
            payload = nonce + ct
        elif algorithm == EncryptionAlgorithm.chacha20_poly1305:
            nonce = os.urandom(12)
            chacha = ChaCha20Poly1305(derived)
            ct = chacha.encrypt(nonce, text.encode(), None)
            payload = nonce + ct
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        return base64.b64encode(payload).decode(), raw_key

    def decrypt_text(self, encrypted_text: str, algorithm: EncryptionAlgorithm, key: str) -> str:
        if algorithm == EncryptionAlgorithm.fernet:
            f = Fernet(key.encode())
            decrypted = f.decrypt(base64.b64decode(encrypted_text))
            return decrypted.decode()

        derived = _derive_key(key)
        payload = base64.b64decode(encrypted_text)

        if algorithm == EncryptionAlgorithm.aes_256_gcm:
            nonce, ct = payload[:12], payload[12:]
            aesgcm = AESGCM(derived)
            return aesgcm.decrypt(nonce, ct, None).decode()
        elif algorithm == EncryptionAlgorithm.chacha20_poly1305:
            nonce, ct = payload[:12], payload[12:]
            chacha = ChaCha20Poly1305(derived)
            return chacha.decrypt(nonce, ct, None).decode()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

    async def transcribe_and_encrypt(
        self,
        db: Session,
        user_id: int,
        filename: str,
        audio_bytes: bytes,
        stt_model: STTModel,
        encryption_algorithm: EncryptionAlgorithm,
        language: str,
    ) -> Transcription:
        record = Transcription(
            user_id=user_id,
            filename=filename,
            stt_model=stt_model,
            encryption_algorithm=encryption_algorithm,
            language=language,
            status=TranscriptionStatus.processing,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        try:
            if WHISPER_AVAILABLE:
                text, duration = self._run_whisper(audio_bytes, stt_model.value, language)
            else:
                text, duration = self._stub_transcribe(audio_bytes)

            encrypted, _key = self.encrypt_text(text, encryption_algorithm)

            record.original_text = text
            record.encrypted_text = encrypted
            record.duration_seconds = duration
            record.status = TranscriptionStatus.completed
            record.completed_at = datetime.utcnow()
        except Exception as exc:
            record.status = TranscriptionStatus.failed
            record.error_message = str(exc)

        db.commit()
        db.refresh(record)
        return record
