# Simple version of outreach enhanced API for Railway deployment
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/outreach/v2", tags=["Enhanced Outreach"])

@router.get("/campaigns")
async def list_campaigns():
    """List campaigns - simplified version"""
    return {"campaigns": [], "total": 0}

@router.post("/campaigns")
async def create_campaign(campaign_data: Dict[str, Any]):
    """Create campaign - simplified version"""
    return {
        "id": "sample-campaign-id",
        "name": campaign_data.get("name", "New Campaign"),
        "status": "draft",
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details"""
    return {
        "id": campaign_id,
        "name": "Sample Campaign",
        "status": "draft",
        "metrics": {
            "total_targets": 0,
            "messages_sent": 0,
            "responses": 0
        }
    }

@router.get("/templates")
async def list_templates():
    """List message templates"""
    return {"templates": []}