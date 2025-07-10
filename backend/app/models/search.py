"""Search model"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class SearchQuery(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: int = 10
    offset: int = 0

class SearchHistory(BaseModel):
    id: str
    user_id: str
    query: str
    filters: Optional[Dict[str, Any]] = None
    results_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SearchResult(BaseModel):
    experts: List[Dict[str, Any]]
    total: int
    query: str
    filters: Optional[Dict[str, Any]] = None
