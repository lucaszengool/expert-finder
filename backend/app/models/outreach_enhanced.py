# Enhanced outreach models for multi-channel campaigns
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum
import uuid

class Channel(str, Enum):
    EMAIL = "email"
    INSTAGRAM = "instagram"
    WHATSAPP = "whatsapp"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    SMS = "sms"
    TELEGRAM = "telegram"

class MessageStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    REPLIED = "replied"
    FAILED = "failed"
    BOUNCED = "bounced"

class CampaignGoal(str, Enum):
    SALES = "sales"
    LEAD_GENERATION = "lead_generation"
    PARTNERSHIP = "partnership"
    RECRUITMENT = "recruitment"
    NETWORKING = "networking"
    CUSTOMER_SUCCESS = "customer_success"
    MARKET_RESEARCH = "market_research"
    CUSTOM = "custom"

class ConversationStage(str, Enum):
    INITIAL_CONTACT = "initial_contact"
    QUALIFICATION = "qualification"
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSING = "closing"
    FOLLOW_UP = "follow_up"

class ResponseType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    QUESTION = "question"
    OBJECTION = "objection"
    REQUEST_INFO = "request_info"
    SCHEDULE_MEETING = "schedule_meeting"
    UNSUBSCRIBE = "unsubscribe"

# Channel-specific credentials
class ChannelCredentials(BaseModel):
    channel: Channel
    credentials: Dict[str, Any]  # Encrypted in production
    is_active: bool = True
    rate_limit: Optional[int] = None
    daily_limit: Optional[int] = None

# Multi-channel message
class OutreachMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    target_id: str
    channel: Channel
    status: MessageStatus = MessageStatus.PENDING
    subject: Optional[str] = None  # For email
    content: str
    media_urls: List[str] = []  # For images, videos
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    reply_content: Optional[str] = None
    thread_id: Optional[str] = None  # For conversation threading
    metadata: Dict[str, Any] = {}

# Enhanced target with multi-channel support
class OutreachTargetEnhanced(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    name: str
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    channels: Dict[Channel, str] = {}  # channel -> contact_info
    profile_data: Dict[str, Any] = {}
    conversation_stage: ConversationStage = ConversationStage.INITIAL_CONTACT
    lead_score: float = 0.0
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    do_not_contact: bool = False
    last_contacted_at: Optional[datetime] = None
    next_followup_at: Optional[datetime] = None

# Goal-based conversation flow
class ConversationFlow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    goal: CampaignGoal
    stages: List[Dict[str, Any]]  # Stage definitions with prompts
    response_handlers: Dict[ResponseType, Dict[str, Any]]
    escalation_rules: List[Dict[str, Any]]
    success_criteria: Dict[str, Any]

# Enhanced campaign with multi-channel support
class OutreachCampaignEnhanced(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    goal: CampaignGoal
    channels: List[Channel]
    conversation_flow_id: Optional[str] = None
    search_criteria: Dict[str, Any]
    targeting_rules: Dict[str, Any]
    personalization_config: Dict[str, Any]
    scheduling_config: Dict[str, Any]
    ai_config: Dict[str, Any]  # AI agent configuration
    budget: Optional[float] = None
    daily_budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = "draft"
    metrics: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# AI Agent configuration
class AIAgentConfig(BaseModel):
    agent_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    personality: str = "professional"
    tone: str = "friendly"
    objectives: List[str]
    knowledge_base: Dict[str, Any]
    response_templates: Dict[str, List[str]]
    objection_handlers: Dict[str, str]
    escalation_triggers: List[str]
    max_messages_per_conversation: int = 10
    response_time_range: Dict[str, int] = {"min": 300, "max": 1800}  # seconds

# Automated response handling
class AutoResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    trigger_type: ResponseType
    trigger_keywords: List[str]
    response_template: str
    channel_specific_templates: Dict[Channel, str] = {}
    actions: List[Dict[str, Any]]  # Actions to take (update CRM, notify team, etc.)
    is_active: bool = True

# Campaign analytics
class CampaignAnalytics(BaseModel):
    campaign_id: str
    total_targets: int
    messages_sent: Dict[Channel, int]
    delivery_rate: Dict[Channel, float]
    open_rate: Dict[Channel, float]
    response_rate: Dict[Channel, float]
    positive_response_rate: float
    conversion_rate: float
    avg_messages_to_conversion: float
    roi: Optional[float] = None
    top_performing_messages: List[Dict[str, Any]]
    response_sentiment: Dict[str, float]
    by_channel_performance: Dict[Channel, Dict[str, Any]]
    by_time_performance: Dict[str, Any]

# Webhook configuration for real-time updates
class WebhookConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: Optional[str] = None
    channel: Optional[Channel] = None
    event_types: List[str]
    url: str
    headers: Dict[str, str] = {}
    is_active: bool = True
    retry_policy: Dict[str, Any] = {"max_retries": 3, "backoff_multiplier": 2}

# Integration settings
class IntegrationSettings(BaseModel):
    user_id: str
    integrations: Dict[str, Dict[str, Any]]  # platform -> settings
    api_keys: Dict[str, str]  # Encrypted in production
    webhooks: List[WebhookConfig]
    sync_settings: Dict[str, Any]

# Template library
class MessageTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    channel: Channel
    goal: CampaignGoal
    stage: ConversationStage
    subject: Optional[str] = None
    content: str
    variables: List[str]
    media_urls: List[str] = []
    performance_metrics: Dict[str, float] = {}
    tags: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# A/B testing
class ABTestVariant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    name: str
    variant_type: str  # "message", "timing", "channel", etc.
    config: Dict[str, Any]
    traffic_percentage: float
    metrics: Dict[str, float] = {}

class ABTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    name: str
    hypothesis: str
    variants: List[ABTestVariant]
    status: str = "running"
    winner: Optional[str] = None
    confidence_level: Optional[float] = None
    start_date: datetime
    end_date: Optional[datetime] = None