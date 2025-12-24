import os
import resend
import logging
import asyncio
from ..config import EMERGENT_LLM_KEY

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

async def send_enrollment_email(email: str, user_id: str, public_key: str):
    """
    Send enrollment confirmation email.
    If RESEND_API_KEY is not set, mocks the sending.
    """
    subject = "Welcome to BioPass Swarm - Your Quantum Identity"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A1A; color: #ffffff; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00FFFF; text-align: center;">BioPass Swarm Identity Created</h2>
        <p>Your quantum-safe biometric identity has been successfully established.</p>
        
        <div style="background-color: #1A1A2E; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #00FFFF;">
            <p style="margin: 5px 0; color: #aaa;">User ID:</p>
            <p style="font-size: 18px; font-weight: bold; color: #00FFFF; margin: 5px 0;">{user_id}</p>
        </div>
        
        <div style="background-color: #1A1A2E; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #aaa;">Public Key (First 32 chars):</p>
            <p style="font-family: monospace; color: #10B981; margin: 5px 0;">{public_key[:32]}...</p>
        </div>
        
        <p><strong>Security Note:</strong> Your private key has been split into 7 shares and distributed to the Guardian Swarm. It exists nowhere in full form.</p>
        
        <hr style="border-color: #333; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">&copy; SoftTechX Ltd. BioPass Swarm.</p>
    </div>
    """

    if not RESEND_API_KEY:
        logger.warning(f"MOCK EMAIL SENT TO {email}: Subject: {subject}")
        return {"status": "mock_success", "id": "mock_email_id"}

    params = {
        "from": "BioPass Security <onboarding@resend.dev>",
        "to": [email],
        "subject": subject,
        "html": html_content
    }

    try:
        email_data = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {email}: {email_data}")
        return email_data
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        # Don't raise error to avoid blocking the flow, just log it
        return {"status": "error", "message": str(e)}
