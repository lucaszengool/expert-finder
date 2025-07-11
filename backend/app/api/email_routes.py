# app/api/email_routes.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Optional, List
import logging
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["email"])

class EmailModificationRequest(BaseModel):
    originalEmail: str
    prompt: str
    context: Optional[Dict] = None

class EmailModificationResponse(BaseModel):
    modifiedEmail: str
    success: bool = True

@router.post("/ai/modify-email", response_model=EmailModificationResponse)
async def modify_email(request: EmailModificationRequest):
    """
    Modify an email using AI based on user prompt
    """
    try:
        modified_email = await ai_service.modify_email(
            original_email=request.originalEmail,
            prompt=request.prompt,
            context=request.context
        )
        
        return EmailModificationResponse(
            modifiedEmail=modified_email,
            success=True
        )
    except Exception as e:
        logger.error(f"Error in modify_email endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))