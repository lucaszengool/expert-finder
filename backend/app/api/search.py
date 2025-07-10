"""Search API endpoints"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.models.schemas import SearchQuery, SearchResponse
from app.services.search_service import SearchService
from app.models.expert import Expert

router = APIRouter(prefix="/api/search", tags=["search"])

# Initialize service
search_service = SearchService()

@router.post("/", response_model=SearchResponse)
async def search_experts(query: SearchQuery):
    """Search for experts based on query and filters"""
    try:
        results = await search_service.search(
            query=query.query,
            source=query.source,
            limit=query.limit,
            offset=query.offset,
            filters=query.filters
        )
        
        return SearchResponse(
            results=results["experts"],
            total=results["total"],
            query=query.query,
            filters=query.filters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vector", response_model=SearchResponse)
async def vector_search(query: SearchQuery):
    """Vector similarity search for experts"""
    try:
        results = await search_service.vector_search(
            query=query.query,
            limit=query.limit,
            filters=query.filters
        )
        
        return SearchResponse(
            results=results["experts"],
            total=results["total"],
            query=query.query,
            filters=query.filters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions")
async def get_search_suggestions(q: str):
    """Get search suggestions based on partial query"""
    if len(q) < 2:
        return {"suggestions": []}
    
    suggestions = await search_service.get_suggestions(q)
    return {"suggestions": suggestions}

@router.get("/trending")
async def get_trending_searches(limit: int = 10):
    """Get trending search terms"""
    trending = await search_service.get_trending_searches(limit)
    return {"trending": trending}
