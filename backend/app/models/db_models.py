from sqlalchemy import Column, String, Text, JSON, DateTime, Integer, Float, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from app.utils.database import Base
import uuid

class ExpertDB(Base):
    """SQLAlchemy model for experts"""
    __tablename__ = "experts"
    __table_args__ = {"extend_existing": True}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    title = Column(String)
    email = Column(String)
    location = Column(String)
    organization = Column(String)
    bio = Column(Text)
    skills = Column(JSON)
    experience = Column(JSON)
    links = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Additional fields for matching
    embedding = Column(JSON)  # Store embeddings for similarity search
    expertise_level = Column(Integer)  # 1-5 scale
    rating = Column(Float)
    total_projects = Column(Integer)
    is_verified = Column(Boolean, default=False)

class EmailTemplateDB(Base):
    __tablename__ = "email_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    category = Column(String)
    subject_pattern = Column(Text)
    body_pattern = Column(Text)
    variables = Column(JSON, default=list)
    tone = Column(String, default="professional")
    success_rate = Column(Float, default=0.0)
    learned_from_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class OutreachCampaignDB(Base):
    __tablename__ = "outreach_campaigns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="draft")
    target_type = Column(String)
    search_query = Column(Text)
    template_id = Column(String, ForeignKey("email_templates.id"), nullable=True)
    personalization_level = Column(String, default="high")
    total_targets = Column(Integer, default=0)
    emails_sent = Column(Integer, default=0)
    emails_opened = Column(Integer, default=0)
    emails_replied = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class OutreachTargetDB(Base):
    __tablename__ = "outreach_targets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("outreach_campaigns.id"))
    target_type = Column(String)
    name = Column(String)
    email = Column(String)
    title = Column(String)
    company = Column(String)
    location = Column(String)
    profile_url = Column(String)
    data = Column(JSON, default=dict)
    status = Column(String, default="pending")
    personalized_subject = Column(Text)
    personalized_body = Column(Text)
    sent_at = Column(DateTime)
    opened_at = Column(DateTime)
    replied_at = Column(DateTime)

class OutreachEmailDB(Base):
    __tablename__ = "outreach_emails"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("outreach_campaigns.id"))
    target_id = Column(String, ForeignKey("outreach_targets.id"))
    direction = Column(String)  # 'sent' or 'received'
    subject = Column(Text)
    body = Column(Text)
    sent_at = Column(DateTime)
    opened_at = Column(DateTime)
    replied_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())