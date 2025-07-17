"""Expert DNA model for matching preferences"""
from enum import Enum
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class WorkStyle(str, Enum):
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    COLLABORATIVE = "collaborative"
    STRATEGIC = "strategic"
    HANDS_ON = "hands_on"
    THEORETICAL = "theoretical"

class CommunicationStyle(str, Enum):
    DIRECT = "direct"
    SUPPORTIVE = "supportive"
    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"
    SIMPLIFIED = "simplified"

class ExpertDNA(BaseModel):
    expert_id: str
    work_style: WorkStyle
    communication_style: CommunicationStyle
    approach: str  # Research-Driven, Practical, Theoretical, Innovative
    personality_traits: List[str]
    industry_focus: List[str]
    client_preferences: Dict[str, Any]  # startup, enterprise, academic, etc.
    preferred_project_size: str  # small, medium, large
    time_zone: str
    languages: List[str]
    tools_used: List[str]
    certifications: List[str]
    teaching_style: Optional[str] = None
    availability_preference: str  # immediate, scheduled, flexible
    created_at: datetime
    updated_at: datetime

class MatchingPreferences(BaseModel):
    user_id: Optional[str] = None
    preferred_work_styles: Optional[List[str]] = []
    preferred_communication_styles: Optional[List[str]] = []
    budget_range: Optional[Dict[str, float]] = {}
    preferred_languages: Optional[List[str]] = []
    preferred_time_zones: Optional[List[str]] = []
    industry_preferences: Optional[List[str]] = []
    skill_priorities: Optional[List[str]] = []
    project_timeline: Optional[str] = None
    team_size_preference: Optional[str] = None
