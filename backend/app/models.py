from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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

class BiometricStepData(BaseModel):
    step: int  # 1=fingerprint, 2=face, 3=heartbeat
    data: dict
    duration_ms: int
    liveness_verified: bool = False

class EnrollmentComplete(BaseModel):
    session_id: str
    fingerprint_data: dict
    face_data: dict
    heartbeat_data: dict

class AppLockItem(BaseModel):
    app_id: str
    app_name: str
    is_locked: bool

class AppLockUpdate(BaseModel):
    session_id: str
    app_id: str
    is_locked: bool

class DeviceLockUpdate(BaseModel):
    session_id: str
    lock_type: str  # "full", "media", "apps"
    is_locked: bool

class QuantumChallengeRequest(BaseModel):
    challenge_type: str
    difficulty_level: str

class SignUpRequest(BaseModel):
    email: str
    password: str

class SignInRequest(BaseModel):
    email: str
    password: str
    bio_key: Optional[str] = None

class BioKeySignInRequest(BaseModel):
    bio_key: str

class ResetPasswordRequest(BaseModel):
    email: str
    bio_key: str
    new_password: str
