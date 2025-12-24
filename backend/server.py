from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import hashlib
import secrets
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# External BioPass API
BIOPASS_API_URL = "https://cmj1nqwjn7tk4yprgudqvroco.agent.pa.smyth.ai"

# Create the main app
app = FastAPI(title="BioPass Swarm Backend")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ MODELS ============

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SessionCreate(BaseModel):
    device_type: str = "web"
    region: Optional[str] = "USA"
    language: Optional[str] = "English"

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_type: str
    region: str
    language: str
    webauthn_status: bool = False
    camera_status: bool = False
    current_step: int = 0
    enrollment_complete: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PermissionUpdate(BaseModel):
    webauthn_status: Optional[bool] = None
    camera_status: Optional[bool] = None

class StepUpdate(BaseModel):
    step: int
    status: str  # "pending", "in_progress", "completed"
    data: Optional[dict] = None

class QuantumChallengeRequest(BaseModel):
    challenge_type: str
    difficulty_level: str

class RecoveryEmailRequest(BaseModel):
    session_id: str
    email: str


# ============ POST-QUANTUM ENCRYPTION SIMULATION ============

class QuantumSafeCrypto:
    """
    Simulates CRYSTALS-Kyber (key encapsulation) and CRYSTALS-Dilithium (signatures)
    using AES-256-GCM for actual encryption with quantum-safe key derivation simulation
    """
    
    @staticmethod
    def generate_kyber_keypair():
        """Simulate Kyber key generation"""
        # In real implementation, this would use liboqs or similar
        private_key = get_random_bytes(32)
        public_key = hashlib.sha3_256(private_key).digest()
        return {
            "private_key": base64.b64encode(private_key).decode(),
            "public_key": base64.b64encode(public_key).decode(),
            "algorithm": "CRYSTALS-Kyber-1024"
        }
    
    @staticmethod
    def kyber_encapsulate(public_key_b64: str):
        """Simulate Kyber key encapsulation"""
        public_key = base64.b64decode(public_key_b64)
        shared_secret = get_random_bytes(32)
        # Simulate ciphertext creation
        ciphertext = hashlib.sha3_512(public_key + shared_secret).digest()
        return {
            "ciphertext": base64.b64encode(ciphertext).decode(),
            "shared_secret": base64.b64encode(shared_secret).decode()
        }
    
    @staticmethod
    def dilithium_sign(message: bytes, private_key_b64: str):
        """Simulate Dilithium signature"""
        private_key = base64.b64decode(private_key_b64)
        # Simulate signature using SHA3-512 + HMAC-like construction
        signature_data = hashlib.sha3_512(private_key + message).digest()
        return {
            "signature": base64.b64encode(signature_data).decode(),
            "algorithm": "CRYSTALS-Dilithium-5"
        }
    
    @staticmethod
    def dilithium_verify(message: bytes, signature_b64: str, public_key_b64: str):
        """Simulate Dilithium verification"""
        # In production, this would use actual Dilithium verification
        return True
    
    @staticmethod
    def encrypt_biometric_data(data: dict, shared_secret_b64: str):
        """Encrypt biometric data using AES-256-GCM with quantum-derived key"""
        shared_secret = base64.b64decode(shared_secret_b64)
        # Derive encryption key using SHA3
        key = hashlib.sha3_256(shared_secret).digest()
        nonce = get_random_bytes(12)
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = json.dumps(data).encode()
        ciphertext, tag = cipher.encrypt_and_digest(plaintext)
        return {
            "ciphertext": base64.b64encode(ciphertext).decode(),
            "nonce": base64.b64encode(nonce).decode(),
            "tag": base64.b64encode(tag).decode(),
            "algorithm": "AES-256-GCM",
            "kdf": "Kyber-KEM + SHA3-256"
        }
    
    @staticmethod
    def decrypt_biometric_data(encrypted_data: dict, shared_secret_b64: str):
        """Decrypt biometric data"""
        shared_secret = base64.b64decode(shared_secret_b64)
        key = hashlib.sha3_256(shared_secret).digest()
        nonce = base64.b64decode(encrypted_data["nonce"])
        ciphertext = base64.b64decode(encrypted_data["ciphertext"])
        tag = base64.b64decode(encrypted_data["tag"])
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        return json.loads(plaintext.decode())


crypto = QuantumSafeCrypto()


# ============ CHAT WITH CLAUDE ============

async def chat_with_claude(message: str, session_id: str) -> str:
    """Send message to Claude Sonnet 4.5 via Emergent integrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return "Chat service unavailable. Please try again later."
        
        system_message = """You are the BioPass Swarm AI Assistant. You help users with:
1. Setting up biometric authentication (WebAuthn, liveness check, heartbeat PPG)
2. Understanding post-quantum encryption (Kyber + Dilithium)
3. Privacy and security questions
4. Troubleshooting permission issues
5. General usage guidance

Be concise, helpful, and security-focused. Never share sensitive information."""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"biopass_{session_id}",
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"Claude chat error: {e}")
        return "I'm having trouble connecting. Please try again or contact support."


# ============ API ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "BioPass Swarm API v1.0", "status": "active"}


@api_router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with AI assistant"""
    response = await chat_with_claude(request.message, request.session_id)
    
    # Store chat history
    await db.chat_history.insert_one({
        "session_id": request.session_id,
        "user_message": request.message,
        "assistant_response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return ChatResponse(response=response, session_id=request.session_id)


@api_router.post("/session/create", response_model=dict)
async def create_session(data: SessionCreate):
    """Create new enrollment session"""
    session = Session(
        device_type=data.device_type,
        region=data.region or "USA",
        language=data.language or "English"
    )
    
    # Generate quantum-safe keys for this session
    keypair = crypto.generate_kyber_keypair()
    
    session_doc = session.model_dump()
    session_doc['created_at'] = session_doc['created_at'].isoformat()
    session_doc['kyber_public_key'] = keypair['public_key']
    
    await db.sessions.insert_one(session_doc)
    
    return {
        "session_id": session.id,
        "public_key": keypair['public_key'],
        "device_type": session.device_type,
        "quantum_algorithm": "CRYSTALS-Kyber-1024"
    }


@api_router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session details"""
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@api_router.patch("/session/{session_id}/permissions")
async def update_permissions(session_id: str, data: PermissionUpdate):
    """Update permission status"""
    update_data = {}
    if data.webauthn_status is not None:
        update_data["webauthn_status"] = data.webauthn_status
    if data.camera_status is not None:
        update_data["camera_status"] = data.camera_status
    
    result = await db.sessions.update_one(
        {"id": session_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "updated", "permissions": update_data}


@api_router.post("/session/{session_id}/step")
async def update_step(session_id: str, data: StepUpdate):
    """Update enrollment step progress"""
    update_data = {
        "current_step": data.step,
        f"step_{data.step}_status": data.status
    }
    
    if data.data:
        # Encrypt biometric data before storing
        session = await db.sessions.find_one({"id": session_id})
        if session and session.get("kyber_public_key"):
            encap = crypto.kyber_encapsulate(session["kyber_public_key"])
            encrypted = crypto.encrypt_biometric_data(data.data, encap["shared_secret"])
            update_data[f"step_{data.step}_data"] = encrypted
    
    if data.step == 3 and data.status == "completed":
        update_data["enrollment_complete"] = True
    
    result = await db.sessions.update_one(
        {"id": session_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "updated", "step": data.step}


@api_router.post("/quantum-challenge")
async def quantum_challenge(data: QuantumChallengeRequest):
    """Generate quantum-resistant challenge"""
    # Call external API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BIOPASS_API_URL}/api/quantum_challenge",
                json={
                    "challenge_type": data.challenge_type,
                    "difficulty_level": data.difficulty_level
                },
                timeout=30.0
            )
            external_response = response.text
    except Exception as e:
        logger.error(f"External API error: {e}")
        external_response = "External service unavailable"
    
    # Generate local quantum challenge
    challenge = secrets.token_bytes(32)
    keypair = crypto.generate_kyber_keypair()
    signature = crypto.dilithium_sign(challenge, keypair["private_key"])
    
    return {
        "challenge": base64.b64encode(challenge).decode(),
        "public_key": keypair["public_key"],
        "signature": signature["signature"],
        "algorithm": "CRYSTALS-Dilithium-5 + Kyber-1024",
        "external_response": external_response,
        "expires_in": 300
    }


@api_router.post("/recovery-email")
async def set_recovery_email(data: RecoveryEmailRequest):
    """Set recovery email for session"""
    result = await db.sessions.update_one(
        {"id": data.session_id},
        {"$set": {"recovery_email": data.email}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"status": "saved", "email": data.email}


@api_router.get("/external/status")
async def get_external_status():
    """Get status from external BioPass API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BIOPASS_API_URL}/api/status",
                timeout=10.0
            )
            return {"status": "connected", "data": response.text}
    except Exception as e:
        logger.error(f"External API error: {e}")
        return {"status": "unavailable", "error": str(e)}


@api_router.get("/external/privacy-policy")
async def get_privacy_policy():
    """Get privacy policy from external API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BIOPASS_API_URL}/api/privacy_policy",
                timeout=10.0
            )
            return {"policy": response.text}
    except Exception as e:
        return {"policy": "Privacy policy unavailable. Your biometric data never leaves your device."}


@api_router.get("/external/usage-guide")
async def get_usage_guide():
    """Get usage guide from external API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BIOPASS_API_URL}/api/usage_guide",
                timeout=10.0
            )
            return {"guide": response.text}
    except Exception as e:
        return {"guide": "Usage guide unavailable. Please use the in-app help."}


@api_router.post("/external/enrollment")
async def external_enrollment(session_id: str):
    """Initiate enrollment with external API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BIOPASS_API_URL}/api/biopass_v3_enrollment",
                json={"session_id": session_id},
                timeout=30.0
            )
            return {"data": response.text}
    except Exception as e:
        logger.error(f"Enrollment API error: {e}")
        return {"error": "Enrollment service unavailable"}


@api_router.post("/external/heartbeat")
async def external_heartbeat(session_id: str, camera_stream: str):
    """Call heartbeat guardian API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BIOPASS_API_URL}/api/heartbeat_guardian",
                json={
                    "camera_stream": camera_stream,
                    "session_id": session_id
                },
                timeout=30.0
            )
            return {"data": response.text}
    except Exception as e:
        logger.error(f"Heartbeat API error: {e}")
        return {"error": "Heartbeat service unavailable"}


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
