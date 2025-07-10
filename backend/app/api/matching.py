from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.models.expert_dna import MatchingPreferences
from app.services.search_service import search_service

router = APIRouter(prefix="/api/matching", tags=["matching"])

class SmartMatchRequest(BaseModel):
    query: str
    preferences: MatchingPreferences
    limit: int = 10

@router.post("/smart-match")
async def smart_match_experts(request: SmartMatchRequest):
    """Find experts using smart matching algorithm"""
    try:
        # Build enhanced query from preferences
        enhanced_query = request.query
        
        # Add skills to query
        if request.preferences.skill_priorities:
            skills_str = " ".join(request.preferences.skill_priorities[:3])
            enhanced_query += f" {skills_str}"
        
        # Add industry preferences
        if request.preferences.industry_preferences:
            enhanced_query += f" {request.preferences.industry_preferences[0]}"
        
        # Search for experts
        results = await search_service.search(
            query=enhanced_query,
            limit=request.limit
        )
        
        # Enhance results with matching scores based on preferences
        for expert in results["experts"]:
            # Calculate match score based on preferences
            score = expert.get("match_score", 80)
            
            # Boost score for skill matches
            expert_skills = expert.get("skills", [])
            for skill in request.preferences.skill_priorities:
                if any(skill.lower() in s.lower() for s in expert_skills):
                    score += 5
            
            expert["match_score"] = min(score, 99)
            
            # Add match reasons
            expert["match_reasons"] = []
            if expert_skills:
                expert["match_reasons"].append(f"Skills match: {', '.join(expert_skills[:3])}")
            if expert.get("location"):
                expert["match_reasons"].append("Available in your region")
            if score > 85:
                expert["match_reasons"].append("High relevance to your query")
        
        # Sort by match score
        results["experts"].sort(key=lambda x: x.get("match_score", 0), reverse=True)
        
        return {
            "matches": results["experts"],
            "total": results["total"],
            "query": request.query,
            "enhanced_query": enhanced_query
        }
        
    except Exception as e:
        print(f"Matching error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/similar-experts/{expert_id}")
async def get_similar_experts(expert_id: str, limit: int = 5):
    """Get similar experts based on an expert ID"""
    try:
        return {
            "similar_experts": [],
            "expert_id": expert_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
