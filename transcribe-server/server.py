# server.py  — FastAPI + faster-whisper (CPU-friendly)

import os, uuid, tempfile, shutil, subprocess
from typing import Optional, List
from asyncio import Lock

import requests
from fastapi import FastAPI, UploadFile, File, Form, Body, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from faster_whisper import WhisperModel

# ====== CONFIG ======
MODEL_NAME   = os.getenv("WHISPER_MODEL",  "base.en")
DEVICE       = "cpu"
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE","int8")
NUM_THREADS  = int(os.getenv("WHISPER_THREADS","6"))
ORIGINS      = os.getenv(
    "ALLOW_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://192.168.29.53:3000"
).split(",")

# BLAS threads (helps some CPUs)
os.environ.setdefault("OMP_NUM_THREADS", str(NUM_THREADS))
os.environ.setdefault("MKL_NUM_THREADS", str(NUM_THREADS))
os.environ.setdefault("OPENBLAS_NUM_THREADS", str(NUM_THREADS))

# ====== APP ======
app = FastAPI(title="Transcription Service (CPU)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_lock = Lock()

# ====== MODEL ======
model = WhisperModel(
    MODEL_NAME,
    device=DEVICE,
    compute_type=COMPUTE_TYPE,
    cpu_threads=NUM_THREADS,
    num_workers=1,
)

# ====== SCHEMAS ======
class Segment(BaseModel):
    id: int
    start: float
    end: float
    text: str

class TranscriptionResponse(BaseModel):
    jobId: str
    language: Optional[str] = None
    text: str
    segments: List[Segment]

class TranscribeJsonRequest(BaseModel):
    url: str
    language: Optional[str] = "en"

# ====== UTILS ======
def to_wav16k(src: str, dst: str) -> None:
    subprocess.run(
        ["ffmpeg","-y","-i",src,"-ac","1","-ar","16000","-f","wav","-vn","-sn","-dn",dst],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True
    )

def _run_whisper(wav_path: str, language: Optional[str] = "en"):
    seg_iter, info = model.transcribe(
        wav_path,
        language=language,
        vad_filter=True,
        beam_size=1,
        word_timestamps=False,
        condition_on_previous_text=True,
        initial_prompt=None,
        no_speech_threshold=0.6,
        log_prob_threshold=-1.0,
        compression_ratio_threshold=2.4,
    )
    segs, full = [], []
    for i, s in enumerate(seg_iter):
        segs.append(Segment(id=i, start=s.start, end=s.end, text=s.text))
        full.append(s.text)
    return segs, getattr(info, "language", language), " ".join(full).strip()

# ====== HEALTH ======
@app.get("/ping")
async def ping():
    return {"ok": True}


# ====== Unified /transcribe endpoint: accepts either JSON {url} or multipart audio ======
import aiohttp

class UrlBody(BaseModel):
    url: str
    language: str | None = None

async def _download_to_temp(url: str) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".bin")
    tmp.close()
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as r:
            r.raise_for_status()
            with open(tmp.name, "wb") as f:
                while True:
                    chunk = await r.content.read(1024 * 64)
                    if not chunk: break
                    f.write(chunk)
    return tmp.name

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile | None = File(None),    # multipart form
    json_body: UrlBody | None = Body(None)    # JSON {url, language}
):
    temp_path = None
    if audio is not None:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{audio.filename}")
        tmp.close()
        data = await audio.read()
        with open(tmp.name, "wb") as f:
            f.write(data)
        temp_path = tmp.name
        language = None
    elif json_body is not None and json_body.url:
        temp_path = await _download_to_temp(json_body.url)
        language = json_body.language
    else:
        return {"detail": [{"type": "missing", "loc": ["body", "audio"], "msg": "Field required"}]}, 422

    segments, info = model.transcribe(temp_path, language=language, vad_filter=True)
    out = []
    for s in segments:
        out.append({"start": float(s.start), "end": float(s.end), "text": s.text.strip()})

    return {"segments": out, "duration_seconds": int(info.duration or 0)}

# ====== MULTIPART UPLOAD (for tools that send files directly) ======
@app.post("/transcribe-upload", response_model=TranscriptionResponse)
async def transcribe_upload(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(default="en"),
    beam_size: int = Form(default=1),
    vad: bool = Form(default=True),
    word_timestamps: bool = Form(default=False),
    initial_prompt: Optional[str] = Form(default=None),
):
    async with job_lock:
        job_id = str(uuid.uuid4())
        tmpdir = tempfile.mkdtemp(prefix="ts_")
        try:
            raw = os.path.join(tmpdir, audio.filename or "audio_input")
            with open(raw, "wb") as f:
                shutil.copyfileobj(audio.file, f)
            wav = os.path.join(tmpdir, "audio_16k.wav")
            to_wav16k(raw, wav)

            # (beam_size, vad, word_timestamps, initial_prompt are set above;
            #  adjust _run_whisper if you want to pass them through)
            segs, lang, text = _run_whisper(wav, language)
            return TranscriptionResponse(jobId=job_id, language=lang, text=text, segments=segs)
        finally:
            try:
                shutil.rmtree(tmpdir)
            except Exception:
                pass

# ====== RAW BYTES (application/octet-stream) ======
@app.post("/transcribe-bytes", response_model=TranscriptionResponse)
async def transcribe_bytes(
    request: Request,
    language: Optional[str] = Query(default="en")
):
    async with job_lock:
        job_id = str(uuid.uuid4())
        tmpdir = tempfile.mkdtemp(prefix="ts_")
        try:
            raw = os.path.join(tmpdir, "audio_input")
            body = await request.body()
            with open(raw, "wb") as f:
                f.write(body)
            wav = os.path.join(tmpdir, "audio_16k.wav")
            to_wav16k(raw, wav)

            segs, lang, text = _run_whisper(wav, language)
            return TranscriptionResponse(jobId=job_id, language=lang, text=text, segments=segs)
        finally:
            try:
                shutil.rmtree(tmpdir)
            except Exception:
                pass
