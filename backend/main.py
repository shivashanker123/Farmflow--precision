"""
FarmFlow Backend API
- User Authentication (JWT)
- Farm Data Persistence (SQLite)
- AI Voice Assistant (Groq + Whisper + edge-tts)
"""

import os
import uuid
import asyncio
import tempfile
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

import edge_tts
from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

from database import engine, Base
from routers import users, farm

# Load environment variables
load_dotenv()

# ============ Configuration ============

# Groq API Configuration
# TODO: Add your Groq API key to environment variable or .env file
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")
GROQ_MODEL = "llama3-8b-8192"  # Fast model for voice responses

TTS_VOICE = "en-US-EricNeural"
TEMP_DIR = Path(tempfile.gettempdir()) / "farmflow_voice"
TEMP_DIR.mkdir(exist_ok=True)

# System prompt for the farming assistant
SYSTEM_PROMPT = """You are a helpful AI farming assistant for FarmFlow, a precision agriculture platform.
You help farmers with irrigation, crop management, and agricultural advice.
Keep your responses conversational, concise (1-3 sentences), and helpful.
You're speaking in a voice conversation, so be natural and friendly."""

# Initialize clients
groq_client: Optional[Groq] = None
whisper_model: Optional[WhisperModel] = None


# ============ Lifespan Context Manager ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("🚀 Starting FarmFlow Backend...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Initialize Groq client
    global groq_client
    if GROQ_API_KEY and GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE":
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized")
    else:
        print("⚠️ GROQ_API_KEY not set - voice AI will not work")
    
    # Pre-load whisper model in background
    asyncio.create_task(asyncio.to_thread(get_whisper_model))
    
    yield
    
    # Cleanup on shutdown
    print("👋 Shutting down...")
    for file in TEMP_DIR.glob("*"):
        try:
            file.unlink()
        except:
            pass


# ============ FastAPI App ============

app = FastAPI(
    title="FarmFlow Backend API",
    description="Backend for FarmFlow Precision Irrigation System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(farm.router)


# ============ Voice AI Functions ============

def get_whisper_model() -> WhisperModel:
    """Lazy load the Whisper model."""
    global whisper_model
    if whisper_model is None:
        print("🎙️ Loading Whisper model...")
        try:
            whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
            print("✅ Whisper loaded on CPU")
        except Exception as e:
            print(f"❌ Failed to load Whisper: {e}")
            raise
    return whisper_model


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio file using faster-whisper."""
    model = get_whisper_model()
    
    print(f"🎧 Transcribing: {audio_path}")
    segments, info = model.transcribe(audio_path, beam_size=1, language="en")
    
    text = " ".join([segment.text for segment in segments]).strip()
    print(f"📝 Transcribed: {text}")
    
    return text


def call_groq(prompt: str, context: str = "") -> str:
    """Call Groq API for LLM response."""
    if not groq_client:
        return "Voice AI is not configured. Please add your GROQ_API_KEY to the environment."
    
    print(f"🧠 Calling Groq with: {prompt[:50]}...")
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    if context:
        messages.append({"role": "assistant", "content": f"Previous context: {context}"})
    
    messages.append({"role": "user", "content": prompt})
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=150,  # Keep responses short for voice
        )
        
        text = chat_completion.choices[0].message.content.strip()
        print(f"🤖 Groq response: {text[:50]}...")
        return text
        
    except Exception as e:
        print(f"❌ Groq error: {e}")
        return "Sorry, I encountered an error. Please try again."


async def text_to_speech(text: str) -> bytes:
    """Convert text to speech using edge-tts."""
    print(f"🔊 Generating speech for: {text[:50]}...")
    
    audio_file = TEMP_DIR / f"tts_{uuid.uuid4().hex}.mp3"
    
    try:
        communicate = edge_tts.Communicate(text, TTS_VOICE)
        await communicate.save(str(audio_file))
        
        with open(audio_file, "rb") as f:
            audio_bytes = f.read()
        
        print(f"✅ Generated {len(audio_bytes)} bytes of audio")
        return audio_bytes
        
    finally:
        if audio_file.exists():
            audio_file.unlink()


def cleanup_temp_file(file_path: str):
    """Delete temporary file."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Cleaned up: {file_path}")
    except Exception as e:
        print(f"⚠️ Could not delete {file_path}: {e}")


# ============ API Endpoints ============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "FarmFlow Backend",
        "version": "1.0.0",
        "whisper": "ready" if whisper_model else "not loaded",
        "groq": "configured" if groq_client else "not configured",
        "tts_voice": TTS_VOICE
    }


@app.get("/health")
async def health():
    """Check if all services are available."""
    return {
        "database": "connected",
        "whisper": "ready" if whisper_model else "loading",
        "groq": "configured" if groq_client else "missing API key",
        "tts": "ready"
    }


# ============ WebSocket Voice Endpoint ============

@app.websocket("/ws/local-live")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time speech-to-speech.
    
    Flow:
    1. Client sends audio bytes (WebM/WAV)
    2. Server transcribes with Whisper
    3. Server gets response from Groq
    4. Server generates speech with edge-tts
    5. Server sends audio bytes back
    """
    await websocket.accept()
    print("🔌 WebSocket connected")
    
    conversation_context = ""
    
    try:
        while True:
            print("👂 Waiting for audio...")
            data = await websocket.receive_bytes()
            print(f"📥 Received {len(data)} bytes of audio")
            
            if len(data) < 1000:
                print("⚠️ Audio too short, skipping")
                await websocket.send_json({
                    "type": "error",
                    "message": "Audio too short"
                })
                continue
            
            audio_file = TEMP_DIR / f"input_{uuid.uuid4().hex}.webm"
            try:
                with open(audio_file, "wb") as f:
                    f.write(data)
                print(f"💾 Saved audio to {audio_file}")
                
                await websocket.send_json({
                    "type": "status",
                    "message": "transcribing"
                })
                
                text = transcribe_audio(str(audio_file))
                
                if not text or len(text.strip()) < 2:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Could not understand audio"
                    })
                    continue
                
                await websocket.send_json({
                    "type": "transcription",
                    "text": text
                })
                
                await websocket.send_json({
                    "type": "status",
                    "message": "thinking"
                })
                
                response_text = call_groq(text, conversation_context)
                
                conversation_context = f"User: {text}\nAssistant: {response_text}"
                
                await websocket.send_json({
                    "type": "response",
                    "text": response_text
                })
                
                await websocket.send_json({
                    "type": "status",
                    "message": "speaking"
                })
                
                audio_response = await text_to_speech(response_text)
                
                await websocket.send_bytes(audio_response)
                
                await websocket.send_json({
                    "type": "status",
                    "message": "done"
                })
                
                print("✅ Response sent successfully")
                
            finally:
                cleanup_temp_file(str(audio_file))
                
    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🌱 FarmFlow Backend API")
    print("=" * 50)
    print(f"🤖 Groq Model: {GROQ_MODEL}")
    print(f"🗣️ TTS Voice: {TTS_VOICE}")
    print(f"📁 Temp dir: {TEMP_DIR}")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
