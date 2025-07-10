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
    user_id: str
    preferred_work_styles: List[WorkStyle]
    preferred_communication_styles: List[CommunicationStyle]
    budget_range: Dict[str, float]  # {"min": 100, "max": 500}
    preferred_languages: List[str]
    preferred_time_zones: List[str]
    industry_preferences: List[str]
    skill_priorities: List[str]
    project_timeline: str  # urgent, short_term, long_term
    team_size_preference: str  # individual, small_team, large_team
