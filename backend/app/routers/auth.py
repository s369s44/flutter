from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import hashlib
import secrets
import base64
from ..database import db
from ..models import SignUpRequest, SignInRequest, BioKeySignInRequest, ResetPasswordRequest

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(password: str) -> str:
    """Hash password using SHA3-256"""
    return hashlib.sha3_256(password.encode()).hexdigest()

def generate_token(user_id: str) -> str:
    """Generate auth token"""
    token_data = f"{user_id}:{secrets.token_hex(32)}:{datetime.now(timezone.utc).isoformat()}"
    return base64.b64encode(hashlib.sha3_256(token_data.encode()).digest()).decode()

@router.post("/signup")
async def auth_signup(data: SignUpRequest):
    """Sign up new user"""
    # Check if email exists
    existing = await db.auth_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "bio_key": None,
        "enrollment_complete": False
    }
    
    await db.auth_users.insert_one(user_doc)
    
    return {
        "success": True,
        "message": "Account created. Complete biometric enrollment to get your Bio Key.",
        "temp_token": generate_token(data.email)
    }

@router.post("/signin")
async def auth_signin(data: SignInRequest):
    """Sign in with email/password"""
    user = await db.auth_users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["password_hash"] != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Optional Bio Key verification for enhanced security
    if data.bio_key:
        if user.get("bio_key") != data.bio_key:
            raise HTTPException(status_code=401, detail="Bio Key mismatch")
    
    return {
        "success": True,
        "token": generate_token(data.email),
        "user_id": user.get("bio_key"),
        "email": data.email
    }

@router.post("/biokey-signin")
async def biokey_signin(data: BioKeySignInRequest):
    """Sign in with Bio Key only"""
    # Find user by bio_key
    user = await db.users.find_one({"user_id": data.bio_key})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Bio Key")
    
    return {
        "success": True,
        "token": generate_token(data.bio_key),
        "user_id": data.bio_key,
        "message": "Bio Key authentication successful"
    }

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Reset password using Bio Key"""
    # Verify Bio Key belongs to user
    user = await db.users.find_one({"user_id": data.bio_key})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Bio Key")
    
    # Find auth user by email
    auth_user = await db.auth_users.find_one({"email": data.email})
    if not auth_user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Verify Bio Key matches
    if auth_user.get("bio_key") != data.bio_key:
        raise HTTPException(status_code=401, detail="Bio Key does not match this email")
    
    # Update password
    await db.auth_users.update_one(
        {"email": data.email},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    
    return {
        "success": True,
        "message": "Password reset successful"
    }

@router.post("/link-biokey")
async def link_biokey(email: str, bio_key: str):
    """Link Bio Key to user account"""
    result = await db.auth_users.update_one(
        {"email": email},
        {"$set": {"bio_key": bio_key, "enrollment_complete": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Bio Key linked to account"}
