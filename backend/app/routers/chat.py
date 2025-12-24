from fastapi import APIRouter
from ..database import db
from ..models import ChatRequest, ChatResponse
from ..config import EMERGENT_LLM_KEY
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

async def chat_with_claude(message: str, session_id: str) -> str:
    """Send message to Claude Sonnet 4.5 via Emergent integrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = EMERGENT_LLM_KEY
        if not api_key:
            return "Chat service unavailable. Please try again later."
        
        system_message = """You are the BioPass Swarm AI Assistant - expert in quantum-safe security. You help users with:

1. Understanding the 7 Guardian system (Alpha, Beta, Gamma, Delta, Epsilon, Zeta, Eta)
2. Explaining 5-of-7 Shamir's Secret Sharing threshold
3. Post-quantum encryption (CRYSTALS-Kyber + CRYSTALS-Dilithium)
4. Biometric enrollment (fingerprint, face liveness, heartbeat PPG)
5. App locking, device protection, media security
6. Privacy guarantees (on-device only, no cloud)
7. Emergency recovery procedures

Be concise, technical but friendly. Emphasize security without being alarming."""
        
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
        return "I'm having trouble connecting. Please try again or check the help documentation."

@router.post("", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with AI assistant"""
    response = await chat_with_claude(request.message, request.session_id)
    
    await db.chat_history.insert_one({
        "session_id": request.session_id,
        "user_message": request.message,
        "assistant_response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return ChatResponse(response=response, session_id=request.session_id)
