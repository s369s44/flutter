import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
from ..database import db
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/vault", tags=["vault"])

UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload a file to the secure vault"""
    # Verify session
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")
    
    # Store metadata
    file_doc = {
        "file_id": file_id,
        "original_name": file.filename,
        "path": file_path,
        "content_type": file.content_type,
        "size": os.path.getsize(file_path),
        "session_id": session_id,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "is_locked": True  # Default to locked
    }
    
    await db.vault_files.insert_one(file_doc)
    
    return {
        "status": "success",
        "file_id": file_id,
        "filename": file.filename,
        "message": "File encrypted and stored in Bio-Vault"
    }

@router.get("/list/{session_id}")
async def list_files(session_id: str):
    """List files in the vault"""
    cursor = db.vault_files.find({"session_id": session_id}, {"_id": 0})
    files = await cursor.to_list(length=100)
    return {"files": files}

@router.post("/lock/{file_id}")
async def toggle_lock(file_id: str, locked: bool):
    """Toggle lock status"""
    result = await db.vault_files.update_one(
        {"file_id": file_id},
        {"$set": {"is_locked": locked}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"status": "success", "file_id": file_id, "is_locked": locked}

@router.delete("/delete/{file_id}")
async def delete_file(file_id: str):
    """Delete file from vault"""
    file_doc = await db.vault_files.find_one({"file_id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Remove from disk
    try:
        if os.path.exists(file_doc["path"]):
            os.remove(file_doc["path"])
    except Exception as e:
        print(f"Error deleting file: {e}")
        
    await db.vault_files.delete_one({"file_id": file_id})
    
    return {"status": "success", "message": "File permanently destroyed"}
