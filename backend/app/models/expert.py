"""Expert model definitions"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ContactMethod(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    LINKEDIN = "linkedin"
    WEBSITE = "website"

class ExpertBase(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    links: Dict[str, str] = {}

class ExpertCreate(ExpertBase):
    pass

class ExpertUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    links: Optional[Dict[str, str]] = None

class Expert(ExpertBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    # Additional fields for enhanced features
    rating: Optional[float] = None
    total_projects: Optional[int] = 0
    verified: bool = False
    availability_status: Optional[str] = None
    rate: Optional[Dict[str, Any]] = None  # {"amount": 150, "currency": "USD", "per": "hour"}
    languages: List[str] = []
    timezone: Optional[str] = None
    
    class Config:
        from_attributes = True

class ExpertSearchResult(BaseModel):
    expert: Expert
    score: float
    match_reasons: List[str] = []
