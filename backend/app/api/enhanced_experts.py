from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.services.expert_service import expert_service
from app.models.expert import Expert

router = APIRouter(prefix="/api/enhanced-experts", tags=["enhanced-experts"])

@router.get("/search-enhanced", response_model=List[Expert])
async def search_experts_enhanced(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = None,
    limit: int = Query(20, le=100)
):
    """Enhanced search with rich expert data"""
    try:
        results = await expert_service.search_experts_enhanced(q, category, limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{expert_id}/detailed", response_model=Expert)
async def get_expert_detailed(expert_id: str):
    """Get detailed expert information"""
    try:
        expert = await expert_service.get_expert_with_details(expert_id)
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")
        return expert
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
