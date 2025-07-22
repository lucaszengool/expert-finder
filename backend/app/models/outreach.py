# backend/app/models/outreach.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class TargetType(str, Enum):
    EXPERT = "expert"
    AGENCY = "agency"
    CLIENT = "client"
    SHOP = "shop"
    ALL = "all"

class OutreachStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class EmailStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    OPENED = "opened"
    REPLIED = "replied"
    BOUNCED = "bounced"

class PersonalizationLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class EmailExample(BaseModel):
    subject: str
    body: str
    outcome: Optional[str] = None  # "successful", "failed", "pending"
    context: Dict[str, Any] = {}
    tags: List[str] = []

class EmailTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    subject_pattern: str
    body_pattern: str
    variables: List[str] = []
    tone: str = "professional"
    success_rate: float = 0.0
    learned_from_count: int = 0

class OutreachTarget(BaseModel):
    id: str
    campaign_id: str
    target_type: TargetType
    name: str
    email: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    profile_url: Optional[str] = None
    data: Dict[str, Any] = {}
    status: EmailStatus = EmailStatus.PENDING
    personalized_subject: Optional[str] = None
    personalized_body: Optional[str] = None
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None

class OutreachCampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[str] = None
    personalization_level: PersonalizationLevel = PersonalizationLevel.HIGH
    daily_limit: int = 50
    
class OutreachCampaign(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: OutreachStatus = OutreachStatus.DRAFT
    target_type: TargetType
    search_query: str
    template_id: Optional[str] = None
    personalization_level: PersonalizationLevel
    total_targets: int = 0
    emails_sent: int = 0
    emails_opened: int = 0
    emails_replied: int = 0
    created_at: datetime
    updated_at: datetime

class BulkOutreachRequest(BaseModel):
    target_ids: List[str]
    template_id: Optional[str] = None
    personalization_level: PersonalizationLevel = PersonalizationLevel.HIGH
    delay_between_emails: int = 2  # seconds

class OutreachAnalytics(BaseModel):
    campaign_id: str
    total_targets: int
    emails_sent: int
    open_rate: float
    response_rate: float
    meeting_scheduled_rate: float
    closed_won_rate: float
    average_deal_size: float

class ScheduledMeeting(BaseModel):
    id: str
    campaign_id: str
    target_id: str
    meeting_date: datetime
    meeting_link: str
    agenda: str
    created_at: datetime