"""SQLAlchemy database models"""
from sqlalchemy import Column, String, Text, JSON, DateTime, Integer, Float, Boolean
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
