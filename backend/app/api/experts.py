"""Expert API endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.models.expert import Expert, ExpertCreate, ExpertUpdate
from app.services.expert_service import ExpertService
from app.utils.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/experts", tags=["experts"])

# Initialize service
expert_service = ExpertService()

@router.get("/", response_model=List[Expert])
async def list_experts(
    skip: int = 0,
    limit: int = 100,
    skills: Optional[str] = None,
    location: Optional[str] = None
):
    """List all experts with optional filtering"""
    filters = {}
    if skills:
        filters["skills"] = skills.split(",")
    if location:
        filters["location"] = location
    
    experts = await expert_service.list_experts(skip=skip, limit=limit, filters=filters)
    return experts

@router.get("/{expert_id}", response_model=Expert)
async def get_expert(expert_id: str):
    """Get a specific expert by ID"""
    expert = await expert_service.get_expert(expert_id)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    return expert

@router.post("/", response_model=Expert)
async def create_expert(expert: ExpertCreate):
    """Create a new expert"""
    return await expert_service.create_expert(expert.dict())

@router.put("/{expert_id}", response_model=Expert)
async def update_expert(expert_id: str, expert: ExpertUpdate):
    """Update an expert"""
    updated_expert = await expert_service.update_expert(expert_id, expert.dict(exclude_unset=True))
    if not updated_expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    return updated_expert

@router.delete("/{expert_id}")
async def delete_expert(expert_id: str):
    """Delete an expert"""
    success = await expert_service.delete_expert(expert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expert not found")
    return {"message": "Expert deleted successfully"}
