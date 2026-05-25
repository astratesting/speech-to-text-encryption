# VoiceVault

Speech-to-text processing with end-to-end encryption. Upload audio, get an encrypted transcript back. Only you hold the key.

**Market**: $9.71B by 2032 | Target: healthcare, banking, media

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| STT | OpenAI Whisper (small / medium / large) |
| Encryption | AES-256-GCM, ChaCha20-Poly1305, Fernet |
| Auth | JWT (HS256) + bcrypt |
| Frontend | Next.js 14, TailwindCSS, React Query |
| Infra | Docker Compose |

---

## Quick start

```bash
cp .env.example .env
# Edit SECRET_KEY to a random 64-char hex string

docker compose up --build
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

---

## Development (no Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voicevault
uvicorn backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

---

## API overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Get JWT |
| GET | `/auth/me` | JWT | Current user |
| POST | `/api/transcribe` | JWT | Upload audio file |
| GET | `/api/transcriptions` | JWT | List transcriptions |
| GET | `/api/transcriptions/{id}` | JWT | Get one (with encrypted text) |
| POST | `/api/decrypt` | JWT | Decrypt with your key |
| DELETE | `/api/transcriptions/{id}` | JWT | Delete |
| GET | `/api/models` | — | List STT models + algorithms |

### Upload example

```bash
curl -X POST http://localhost:8000/api/transcribe \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@interview.wav" \
  -F "stt_model=whisper-small" \
  -F "encryption_algorithm=aes_256_gcm" \
  -F "language=en"
```

### Decrypt example

```bash
curl -X POST http://localhost:8000/api/decrypt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcription_id": 1, "encryption_key": "your-key-here"}'
```

---

## Encryption notes

- **AES-256-GCM** and **ChaCha20-Poly1305**: pass any string as key; SHA-256 derived to 32 bytes internally. Store the raw string — that is what decryption needs.
- **Fernet**: random key generated per transcription. Expose via dedicated endpoint in production rather than storing server-side.
- `original_text` stored alongside `encrypted_text` for dev convenience. Remove in production for zero-knowledge.

---

## License

MIT
