from fastapi import APIRouter
from ..agents.coordinator import coordinator
from ..config import BIOPASS_API_URL
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["system"])

DEFAULT_APPS = [
    {"app_id": "whatsapp", "app_name": "WhatsApp", "category": "messaging", "icon": "message-circle"},
    {"app_id": "instagram", "app_name": "Instagram", "category": "social", "icon": "camera"},
    {"app_id": "facebook", "app_name": "Facebook", "category": "social", "icon": "facebook"},
    {"app_id": "twitter", "app_name": "X (Twitter)", "category": "social", "icon": "twitter"},
    {"app_id": "telegram", "app_name": "Telegram", "category": "messaging", "icon": "send"},
    {"app_id": "snapchat", "app_name": "Snapchat", "category": "social", "icon": "ghost"},
    {"app_id": "tiktok", "app_name": "TikTok", "category": "entertainment", "icon": "music"},
    {"app_id": "youtube", "app_name": "YouTube", "category": "entertainment", "icon": "play-circle"},
    {"app_id": "netflix", "app_name": "Netflix", "category": "entertainment", "icon": "tv"},
    {"app_id": "spotify", "app_name": "Spotify", "category": "music", "icon": "music"},
    {"app_id": "gmail", "app_name": "Gmail", "category": "productivity", "icon": "mail"},
    {"app_id": "drive", "app_name": "Google Drive", "category": "productivity", "icon": "hard-drive"},
    {"app_id": "photos", "app_name": "Photos", "category": "media", "icon": "image"},
    {"app_id": "gallery", "app_name": "Gallery", "category": "media", "icon": "images"},
    {"app_id": "banking", "app_name": "Banking App", "category": "finance", "icon": "credit-card"},
    {"app_id": "paypal", "app_name": "PayPal", "category": "finance", "icon": "dollar-sign"},
    {"app_id": "crypto", "app_name": "Crypto Wallet", "category": "finance", "icon": "bitcoin"},
    {"app_id": "notes", "app_name": "Notes", "category": "productivity", "icon": "file-text"},
    {"app_id": "files", "app_name": "Files", "category": "productivity", "icon": "folder"},
    {"app_id": "settings", "app_name": "Settings", "category": "system", "icon": "settings"},
]

@router.get("/guardians/status")
async def get_guardians_status():
    """Get status of all 7 Guardian agents"""
    return {
        "coordinator": {
            "id": coordinator.id,
            "name": coordinator.name,
            "status": coordinator.status,
            "threshold": f"{coordinator.threshold}-of-7"
        },
        "guardians": coordinator.get_all_guardians_status(),
        "system_ready": all(g.status in ["READY", "HOLDING_SHARE"] for g in coordinator.guardians)
    }

@router.get("/apps/list")
async def get_apps_list():
    """Get list of apps that can be locked"""
    return {
        "apps": DEFAULT_APPS,
        "categories": ["messaging", "social", "entertainment", "music", "productivity", "media", "finance", "system"]
    }

@router.get("/permissions/status")
async def get_permissions_status():
    """Get current encryption and permission status"""
    return {
        "encryption": {
            "algorithm": "CRYSTALS-Kyber-1024 + Dilithium-5",
            "key_size": "256-bit AES-GCM",
            "post_quantum": True,
            "nist_level": 5
        },
        "guardians": {
            "total": 7,
            "threshold": "5-of-7",
            "regions": ["North", "South", "East", "West", "Central", "Pacific", "Atlantic"]
        },
        "security_features": [
            "Shamir's Secret Sharing",
            "8-second auto-destruct",
            "Anti-deepfake liveness detection",
            "Heartbeat PPG verification",
            "On-device processing only",
            "Zero cloud storage"
        ],
        "access_permissions": [
            {"name": "Camera", "purpose": "Face liveness & heartbeat PPG", "required": True},
            {"name": "WebAuthn", "purpose": "Fingerprint/biometric", "required": True},
            {"name": "Local Storage", "purpose": "Encrypted key storage", "required": True}
        ]
    }

@router.get("/external/status")
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

@router.get("/external/privacy-policy")
async def get_privacy_policy():
    """Get privacy policy"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BIOPASS_API_URL}/api/privacy_policy",
                timeout=10.0
            )
            return {"policy": response.text}
    except Exception as e:
        return {"policy": "Your biometric data never leaves your device. Protected by 7 distributed Guardians with 5-of-7 threshold."}

@router.get("/external/usage-guide")
async def get_usage_guide():
    """Get usage guide"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BIOPASS_API_URL}/api/usage_guide",
                timeout=10.0
            )
            return {"guide": response.text}
    except Exception as e:
        return {"guide": "Complete 3 biometric steps (10s each): Fingerprint → Face → Heartbeat. Your key is split across 7 Guardians."}
