# backend/app/models/outreach.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class EmailCategory(str, Enum):
    COLD_OUTREACH = "cold_outreach"
    FOLLOW_UP = "follow_up"
    NEGOTIATION = "negotiation"
    MEETING_REQUEST = "meeting_request"
    CLOSING = "closing"

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class TargetStatus(str, Enum):
    PENDING = "pending"
    CONTACTED = "contacted"
    RESPONDED = "responded"
    NEGOTIATING = "negotiating"
    MEETING_SCHEDULED = "meeting_scheduled"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class NegotiationState(str, Enum):
    INITIAL_CONTACT = "initial_contact"
    INTEREST_SHOWN = "interest_shown"
    NEGOTIATING_TERMS = "negotiating_terms"
    FINAL_OFFER = "final_offer"
    CLOSED = "closed"

# Email Template Models
class EmailTemplateBase(BaseModel):
    name: str
    category: EmailCategory
    template_content: str
    learned_patterns: Optional[Dict[str, Any]] = {}

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplate(EmailTemplateBase):
    id: str
    success_rate: float = 0.0
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Email Example for Learning
class EmailExample(BaseModel):
    category: EmailCategory
    subject: str
    content: str
    success: bool
    metadata: Optional[Dict[str, Any]] = {}

class EmailExampleResponse(EmailExample):
    id: str
    extracted_features: Dict[str, Any]
    created_at: datetime

    class Config:
        orm_mode = True

# Campaign Models
class CampaignGoals(BaseModel):
    primary_goal: str  # e.g., "schedule_meeting", "close_deal", "get_response"
    success_metrics: Dict[str, Any]
    desired_outcome: str

class CampaignBudget(BaseModel):
    min_amount: Optional[float]
    max_amount: Optional[float]
    currency: str = "USD"
    payment_terms: Optional[str]

class OutreachCampaignBase(BaseModel):
    name: str
    description: Optional[str]
    search_query: str
    target_type: str  # experts, agencies, clients, shops
    goals: CampaignGoals
    requirements: Optional[Dict[str, Any]] = {}
    budget: Optional[CampaignBudget]
    template_id: Optional[str]

class OutreachCampaignCreate(OutreachCampaignBase):
    pass

class OutreachCampaign(OutreachCampaignBase):
    id: str
    status: CampaignStatus
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Target Models
class OutreachTargetBase(BaseModel):
    name: str
    email: Optional[str]
    company: Optional[str]
    linkedin_url: Optional[str]
    website: Optional[str]
    additional_info: Optional[Dict[str, Any]] = {}
    score: Optional[float]

class OutreachTargetCreate(OutreachTargetBase):
    campaign_id: str
    target_id: Optional[str]  # Reference to expert_id if applicable

class OutreachTarget(OutreachTargetBase):
    id: str
    campaign_id: str
    status: TargetStatus
    created_at: datetime

    class Config:
        orm_mode = True

# Email Models
class PersonalizationData(BaseModel):
    recipient_name: str
    company_name: Optional[str]
    role: Optional[str]
    recent_achievement: Optional[str]
    mutual_connection: Optional[str]
    pain_points: Optional[List[str]]
    value_proposition: str

class OutreachEmailBase(BaseModel):
    subject: str
    content: str
    personalization_data: Optional[PersonalizationData]
    email_type: EmailCategory

class OutreachEmailCreate(OutreachEmailBase):
    thread_id: str
    campaign_id: str
    target_id: str

class OutreachEmail(OutreachEmailBase):
    id: str
    thread_id: str
    campaign_id: str
    target_id: str
    direction: str  # sent, received
    sent_at: Optional[datetime]
    opened_at: Optional[datetime]
    clicked_at: Optional[datetime]
    replied_at: Optional[datetime]
    ai_generated: bool
    created_at: datetime

    class Config:
        orm_mode = True

# Negotiation Models
class NegotiationOffer(BaseModel):
    amount: Optional[float]
    terms: Dict[str, Any]
    proposed_by: str  # "us" or "them"
    timestamp: datetime

class NegotiationBase(BaseModel):
    current_state: NegotiationState
    current_offer: Optional[NegotiationOffer]
    ai_strategy: Optional[str]

class NegotiationCreate(NegotiationBase):
    thread_id: str
    campaign_id: str
    target_id: str

class Negotiation(NegotiationBase):
    id: str
    thread_id: str
    campaign_id: str
    target_id: str
    negotiation_history: List[NegotiationOffer] = []
    target_response: Optional[Dict[str, Any]]
    next_action: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Meeting Models
class ScheduledMeetingBase(BaseModel):
    meeting_type: str  # intro_call, demo, negotiation, closing
    scheduled_at: datetime
    duration_minutes: int = 30
    meeting_link: Optional[str]
    agenda: Optional[str]

class ScheduledMeetingCreate(ScheduledMeetingBase):
    campaign_id: str
    target_id: str
    thread_id: Optional[str]

class ScheduledMeeting(ScheduledMeetingBase):
    id: str
    campaign_id: str
    target_id: str
    thread_id: Optional[str]
    notes: Optional[str]
    status: str  # scheduled, completed, cancelled, rescheduled
    created_at: datetime

    class Config:
        orm_mode = True

# Bulk Action Models
class BulkOutreachRequest(BaseModel):
    campaign_id: str
    target_ids: List[str]
    template_id: Optional[str]
    personalization_level: str = "high"  # high, medium, low
    delay_between_emails: int = 60  # seconds

class OutreachAnalytics(BaseModel):
    campaign_id: str
    total_targets: int
    emails_sent: int
    open_rate: float
    response_rate: float
    meeting_scheduled_rate: float
    closed_won_rate: float
    average_deal_size: Optional[float]