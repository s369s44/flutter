from fastapi import APIRouter, HTTPException
import uuid
import secrets
import base64
import asyncio
import logging
import httpx
from datetime import datetime, timezone
from Crypto.Random import get_random_bytes

from ..database import db
from ..config import BIOPASS_API_URL
from ..models import (
    SessionCreate, BiometricStepData, EnrollmentComplete, 
    AppLockUpdate, DeviceLockUpdate, QuantumChallengeRequest,
    EnrollmentEmailRequest
)
from ..services.email_service import send_enrollment_email
from ..crypto import crypto
from ..agents.coordinator import coordinator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["session"])

async def destroy_key_after_delay(session_id: str):
    """Destroy reconstructed key after 8 seconds"""
    await asyncio.sleep(8)
    coordinator.destroy_all_shares()
    logger.info(f"Key destroyed for session {session_id}")

@router.post("/session/create")
async def create_session(data: SessionCreate):
    """Create new enrollment session"""
    session_id = str(uuid.uuid4())
    
    session_doc = {
        "id": session_id,
        "device_type": data.device_type,
        "region": data.region or "USA",
        "language": data.language or "English",
        "webauthn_status": False,
        "camera_status": False,
        "biometric_steps": {
            "fingerprint": {"status": "pending", "data": None},
            "face": {"status": "pending", "data": None},
            "heartbeat": {"status": "pending", "data": None}
        },
        "enrollment_complete": False,
        "user_id": None,
        "locked_apps": [],
        "device_lock": {"full": False, "media": False, "apps": False},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sessions.insert_one(session_doc)
    
    # Log to ultra memory
    coordinator.add_ultra_memory(
        "system",
        f"New session created: {session_id[:8]}...",
        {"device": data.device_type, "region": data.region}
    )
    
    return {
        "session_id": session_id,
        "device_type": data.device_type,
        "guardians_ready": 7,
        "threshold": "5-of-7",
        "encryption": "CRYSTALS-Kyber-1024"
    }

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session details"""
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/session/{session_id}/biometric-step")
async def submit_biometric_step(session_id: str, data: BiometricStepData):
    """Submit a biometric step (1=fingerprint, 2=face, 3=heartbeat)"""
    step_names = {1: "fingerprint", 2: "face", 3: "heartbeat"}
    step_name = step_names.get(data.step)
    
    if not step_name:
        raise HTTPException(status_code=400, detail="Invalid step number")
    
    update_data = {
        f"biometric_steps.{step_name}": {
            "status": "completed",
            "data": data.data,
            "duration_ms": data.duration_ms,
            "liveness_verified": data.liveness_verified,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    result = await db.sessions.update_one(
        {"id": session_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "status": "completed",
        "step": data.step,
        "step_name": step_name,
        "next_step": data.step + 1 if data.step < 3 else None
    }

@router.post("/session/{session_id}/complete-enrollment")
async def complete_enrollment(session_id: str, data: EnrollmentComplete):
    """Complete enrollment - generate keys, split to guardians, create user ID"""
    
    # Get session
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Generate bio entropy from 3 biometric sources
    bio_entropy = crypto.generate_bio_entropy(
        data.fingerprint_data,
        data.face_data,
        data.heartbeat_data
    )
    
    # Generate Kyber keypair
    keypair = crypto.generate_kyber_keypair_from_entropy(bio_entropy)
    
    # Split private key using Shamir's 5-of-7
    shares = crypto.split_key_shamir(keypair["private_key"])
    
    # Distribute shares to guardians
    guardian_keys = [get_random_bytes(32) for _ in range(7)]
    encrypted_shares = []
    for i, share in enumerate(shares):
        encrypted = crypto.encrypt_share(share, guardian_keys[i])
        encrypted_shares.append(encrypted)
    
    coordinator.distribute_shares(encrypted_shares)
    
    # Generate unique user ID
    user_id = crypto.generate_user_id(bio_entropy, keypair["public_key"])
    
    # Update session
    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {
            "enrollment_complete": True,
            "user_id": user_id,
            "public_key": keypair["public_key"],
            "enrollment_completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Store user record
    await db.users.insert_one({
        "user_id": user_id,
        "session_id": session_id,
        "public_key": keypair["public_key"],
        "algorithm": keypair["algorithm"],
        "guardians_holding": 7,
        "threshold": 5,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "enrollment_complete",
        "user_id": user_id,
        "public_key": keypair["public_key"],
        "algorithm": keypair["algorithm"],
        "security_level": keypair["security_level"],
        "guardians": {
            "total": 7,
            "holding_shares": 7,
            "threshold": 5
        },
        "key_destruction": "8 seconds after use",
        "message": "Your identity is now quantum-protected!"
    }

@router.get("/session/{session_id}/locked-apps")
async def get_locked_apps(session_id: str):
    """Get user's locked apps"""
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "locked_apps": session.get("locked_apps", []),
        "device_lock": session.get("device_lock", {"full": False, "media": False, "apps": False})
    }

@router.post("/session/{session_id}/lock-app")
async def lock_app(session_id: str, data: AppLockUpdate):
    """Lock or unlock an app"""
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    locked_apps = session.get("locked_apps", [])
    
    if data.is_locked:
        if data.app_id not in locked_apps:
            locked_apps.append(data.app_id)
    else:
        if data.app_id in locked_apps:
            locked_apps.remove(data.app_id)
    
    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"locked_apps": locked_apps}}
    )
    
    return {
        "status": "updated",
        "app_id": data.app_id,
        "is_locked": data.is_locked,
        "total_locked": len(locked_apps)
    }

@router.post("/session/{session_id}/device-lock")
async def update_device_lock(session_id: str, data: DeviceLockUpdate):
    """Update device lock settings (full, media, apps)"""
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    device_lock = session.get("device_lock", {"full": False, "media": False, "apps": False})
    device_lock[data.lock_type] = data.is_locked
    
    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"device_lock": device_lock}}
    )
    
    return {
        "status": "updated",
        "lock_type": data.lock_type,
        "is_locked": data.is_locked,
        "device_lock": device_lock
    }

@router.post("/quantum-challenge")
async def quantum_challenge(data: QuantumChallengeRequest):
    """Generate quantum-resistant challenge"""
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
    
    challenge = secrets.token_bytes(32)
    
    return {
        "challenge": base64.b64encode(challenge).decode(),
        "algorithm": "CRYSTALS-Dilithium-5 + Kyber-1024",
        "external_response": external_response,
        "expires_in": 60,
        "requires_shares": 5
    }

@router.post("/authenticate")
async def authenticate_user(session_id: str, challenge: str):
    """Authenticate user by reconstructing key from guardians"""
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.get("enrollment_complete"):
        raise HTTPException(status_code=400, detail="Enrollment not complete")
    
    # Simulate share collection from 5+ guardians
    shares_collected = coordinator.collect_shares(5)
    
    if not shares_collected:
        raise HTTPException(status_code=403, detail="Unable to collect required shares")
    
    # Sign the challenge
    signature = crypto.dilithium_sign(
        challenge.encode(),
        secrets.token_bytes(32)  # Simulated reconstructed key
    )
    
    # Schedule key destruction (8 seconds)
    asyncio.create_task(destroy_key_after_delay(session_id))
    
    return {
        "status": "authenticated",
        "user_id": session.get("user_id"),
        "signature": signature["signature"],
        "algorithm": signature["algorithm"],
        "shares_used": 5,
        "key_destruction_in": "8 seconds",
        "guardians_responded": ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]
    }

@router.post("/session/send-id-email")
async def send_id_email(data: EnrollmentEmailRequest):
    """Send User ID via email after enrollment"""
    session = await db.sessions.find_one({"id": data.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.get("enrollment_complete"):
        raise HTTPException(status_code=400, detail="Enrollment not complete")
    
    user_id = session.get("user_id")
    public_key = session.get("public_key")
    
    # Send email (mock or real)
    await send_enrollment_email(data.email, user_id, public_key)
    
    return {"status": "success", "message": f"Email sent to {data.email}"}
