"""Marketplace service"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.marketplace import MarketplaceListing

class MarketplaceService:
    def create_listing(self, listing_data: dict, db: Session) -> MarketplaceListing:
        """Create a new marketplace listing"""
        listing = MarketplaceListing(**listing_data)
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing
    
    def get_listings(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        db: Optional[Session] = None
    ) -> List[MarketplaceListing]:
        """Get marketplace listings"""
        if not db:
            return []
        
        query = db.query(MarketplaceListing).filter(MarketplaceListing.is_active == True)
        
        if category:
            query = query.filter(MarketplaceListing.category == category)
        
        return query.offset(skip).limit(limit).all()
    
    def get_listing(self, listing_id: int, db: Session) -> Optional[MarketplaceListing]:
        """Get a specific listing"""
        return db.query(MarketplaceListing).filter(
            MarketplaceListing.id == listing_id,
            MarketplaceListing.is_active == True
        ).first()
