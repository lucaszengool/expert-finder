"""Marketplace models"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MarketplaceListingBase(BaseModel):
    expert_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    currency: str = "USD"
    duration: Optional[str] = None  # e.g., "1 hour", "30 minutes"
    is_active: bool = True

class MarketplaceListingCreate(MarketplaceListingBase):
    pass

class MarketplaceListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    duration: Optional[str] = None
    is_active: Optional[bool] = None

class MarketplaceListing(MarketplaceListingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
