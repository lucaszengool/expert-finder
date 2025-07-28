# SQLAlchemy database models for enhanced outreach
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()

# Enums
class ChannelEnum(enum.Enum):
    EMAIL = "email"
    INSTAGRAM = "instagram"
    WHATSAPP = "whatsapp"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    SMS = "sms"
    TELEGRAM = "telegram"

class MessageStatusEnum(enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    REPLIED = "replied"
    FAILED = "failed"
    BOUNCED = "bounced"

class CampaignGoalEnum(enum.Enum):
    SALES = "sales"
    LEAD_GENERATION = "lead_generation"
    PARTNERSHIP = "partnership"
    RECRUITMENT = "recruitment"
    NETWORKING = "networking"
    CUSTOMER_SUCCESS = "customer_success"
    MARKET_RESEARCH = "market_research"
    CUSTOM = "custom"

class ConversationStageEnum(enum.Enum):
    INITIAL_CONTACT = "initial_contact"
    QUALIFICATION = "qualification"
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSING = "closing"
    FOLLOW_UP = "follow_up"

# Database Models
class OutreachCampaign(Base):
    __tablename__ = 'outreach_campaigns'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    goal = Column(SQLEnum(CampaignGoalEnum), nullable=False)
    channels = Column(JSON, nullable=False)  # List of channels
    conversation_flow_id = Column(String, ForeignKey('conversation_flows.id'))
    search_criteria = Column(JSON)
    targeting_rules = Column(JSON)
    personalization_config = Column(JSON)
    scheduling_config = Column(JSON)
    ai_config = Column(JSON)
    budget = Column(Float)
    daily_budget = Column(Float)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(String, default='draft')
    metrics = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    targets = relationship("OutreachTarget", back_populates="campaign", cascade="all, delete-orphan")
    messages = relationship("OutreachMessage", back_populates="campaign", cascade="all, delete-orphan")
    conversation_flow = relationship("ConversationFlow", back_populates="campaigns")
    ai_agents = relationship("AIAgent", back_populates="campaign", cascade="all, delete-orphan")
    analytics = relationship("CampaignAnalytics", back_populates="campaign", uselist=False)
    ab_tests = relationship("ABTest", back_populates="campaign", cascade="all, delete-orphan")

class OutreachTarget(Base):
    __tablename__ = 'outreach_targets'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'), nullable=False)
    name = Column(String, nullable=False)
    company = Column(String)
    title = Column(String)
    location = Column(String)
    timezone = Column(String)
    channels = Column(JSON)  # Dict[channel, contact_info]
    profile_data = Column(JSON)
    conversation_stage = Column(SQLEnum(ConversationStageEnum), default=ConversationStageEnum.INITIAL_CONTACT)
    lead_score = Column(Float, default=0.0)
    tags = Column(JSON, default=[])
    custom_fields = Column(JSON, default={})
    do_not_contact = Column(Boolean, default=False)
    last_contacted_at = Column(DateTime)
    next_followup_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaign = relationship("OutreachCampaign", back_populates="targets")
    messages = relationship("OutreachMessage", back_populates="target", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="target", cascade="all, delete-orphan")

class OutreachMessage(Base):
    __tablename__ = 'outreach_messages'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'), nullable=False)
    target_id = Column(String, ForeignKey('outreach_targets.id'), nullable=False)
    conversation_id = Column(String, ForeignKey('conversations.id'))
    channel = Column(SQLEnum(ChannelEnum), nullable=False)
    status = Column(SQLEnum(MessageStatusEnum), default=MessageStatusEnum.PENDING)
    subject = Column(String)  # For email
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, default=[])
    scheduled_at = Column(DateTime)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    read_at = Column(DateTime)
    replied_at = Column(DateTime)
    reply_content = Column(Text)
    thread_id = Column(String)
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("OutreachCampaign", back_populates="messages")
    target = relationship("OutreachTarget", back_populates="messages")
    conversation = relationship("Conversation", back_populates="messages")

class Conversation(Base):
    __tablename__ = 'conversations'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    target_id = Column(String, ForeignKey('outreach_targets.id'), nullable=False)
    channel = Column(SQLEnum(ChannelEnum), nullable=False)
    stage = Column(SQLEnum(ConversationStageEnum), default=ConversationStageEnum.INITIAL_CONTACT)
    is_active = Column(Boolean, default=True)
    ai_agent_id = Column(String, ForeignKey('ai_agents.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    target = relationship("OutreachTarget", back_populates="conversations")
    messages = relationship("OutreachMessage", back_populates="conversation", order_by="OutreachMessage.created_at")
    ai_agent = relationship("AIAgent", back_populates="conversations")

class ConversationFlow(Base):
    __tablename__ = 'conversation_flows'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    goal = Column(SQLEnum(CampaignGoalEnum), nullable=False)
    stages = Column(JSON)  # Stage definitions with prompts
    response_handlers = Column(JSON)  # Response type -> handler config
    escalation_rules = Column(JSON)
    success_criteria = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaigns = relationship("OutreachCampaign", back_populates="conversation_flow")

class AIAgent(Base):
    __tablename__ = 'ai_agents'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'), nullable=False)
    personality = Column(String, default='professional')
    tone = Column(String, default='friendly')
    objectives = Column(JSON)
    knowledge_base = Column(JSON)
    response_templates = Column(JSON)
    objection_handlers = Column(JSON)
    escalation_triggers = Column(JSON)
    max_messages_per_conversation = Column(Integer, default=10)
    response_time_range = Column(JSON, default={"min": 300, "max": 1800})
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("OutreachCampaign", back_populates="ai_agents")
    conversations = relationship("Conversation", back_populates="ai_agent")

class MessageTemplate(Base):
    __tablename__ = 'message_templates'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)  # NULL for system templates
    name = Column(String, nullable=False)
    category = Column(String)
    channel = Column(SQLEnum(ChannelEnum), nullable=False)
    goal = Column(SQLEnum(CampaignGoalEnum))
    stage = Column(SQLEnum(ConversationStageEnum))
    subject = Column(String)
    content = Column(Text, nullable=False)
    variables = Column(JSON, default=[])
    media_urls = Column(JSON, default=[])
    performance_metrics = Column(JSON, default={})
    tags = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CampaignAnalytics(Base):
    __tablename__ = 'campaign_analytics'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'), nullable=False, unique=True)
    total_targets = Column(Integer, default=0)
    messages_sent = Column(JSON, default={})  # by channel
    delivery_rate = Column(JSON, default={})  # by channel
    open_rate = Column(JSON, default={})  # by channel
    response_rate = Column(JSON, default={})  # by channel
    positive_response_rate = Column(Float, default=0.0)
    conversion_rate = Column(Float, default=0.0)
    avg_messages_to_conversion = Column(Float, default=0.0)
    roi = Column(Float)
    top_performing_messages = Column(JSON, default=[])
    response_sentiment = Column(JSON, default={})
    by_channel_performance = Column(JSON, default={})
    by_time_performance = Column(JSON, default={})
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaign = relationship("OutreachCampaign", back_populates="analytics")

class ChannelCredential(Base):
    __tablename__ = 'channel_credentials'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    channel = Column(SQLEnum(ChannelEnum), nullable=False)
    credentials = Column(JSON)  # Encrypted
    is_active = Column(Boolean, default=True)
    rate_limit = Column(Integer)
    daily_limit = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WebhookConfig(Base):
    __tablename__ = 'webhook_configs'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'))
    channel = Column(SQLEnum(ChannelEnum))
    event_types = Column(JSON, nullable=False)
    url = Column(String, nullable=False)
    headers = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    retry_policy = Column(JSON, default={"max_retries": 3, "backoff_multiplier": 2})
    created_at = Column(DateTime, default=datetime.utcnow)

class AutoResponse(Base):
    __tablename__ = 'auto_responses'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'), nullable=False)
    trigger_type = Column(String, nullable=False)
    trigger_keywords = Column(JSON, default=[])
    response_template = Column(Text, nullable=False)
    channel_specific_templates = Column(JSON, default={})
    actions = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ABTest(Base):
    __tablename__ = 'ab_tests'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey('outreach_campaigns.id'), nullable=False)
    name = Column(String, nullable=False)
    hypothesis = Column(Text)
    variants = Column(JSON)  # List of variant configs
    status = Column(String, default='running')
    winner = Column(String)
    confidence_level = Column(Float)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("OutreachCampaign", back_populates="ab_tests")