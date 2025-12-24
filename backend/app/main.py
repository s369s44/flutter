from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
from .config import CORS_ORIGINS
from .database import close_mongo_connection
from .routers import auth, session, chat, wallet, system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="BioPass Swarm Backend - Multi-Agent Architecture")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(session.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(wallet.router, prefix="/api")
app.include_router(system.router, prefix="/api")

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes deployment"""
    return {"status": "healthy", "service": "biopass-swarm"}

@app.get("/api")
async def root():
    return {
        "message": "BioPass Swarm API v2.0 - Multi-Agent Architecture",
        "status": "active",
        "guardians": 7,
        "threshold": "5-of-7",
        "encryption": "CRYSTALS-Kyber-1024 + Dilithium-5"
    }

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
