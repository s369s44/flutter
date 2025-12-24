from fastapi import APIRouter, HTTPException
from ..database import db
from datetime import datetime, timezone

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.get("/{user_id}")
async def get_wallet(user_id: str):
    """Get wallet details by user ID"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return {
        "user_id": user_id,
        "public_key": user.get("public_key"),
        "algorithm": user.get("algorithm", "CRYSTALS-Kyber-1024"),
        "stats": {
            "guardians_holding": user.get("guardians_holding", 7),
            "threshold": user.get("threshold", 5),
            "last_auth": user.get("last_auth"),
            "security_score": 98,
            "created_at": user.get("created_at")
        }
    }

@router.post("/{user_id}/export")
async def export_wallet(user_id: str):
    """Export wallet keys"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return {
        "user_id": user_id,
        "public_key": user.get("public_key"),
        "algorithm": user.get("algorithm"),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "warning": "KEEP THIS DATA SECURE. Your Bio Key is your identity."
    }
