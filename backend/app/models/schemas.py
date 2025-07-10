from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SearchQuery(BaseModel):
    query: str
    source: str = "all"
    limit: int = 10
    offset: int = 0
    filters: Dict[str, Any] = {}

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total: int
    query: str
    filters: Dict[str, Any]
