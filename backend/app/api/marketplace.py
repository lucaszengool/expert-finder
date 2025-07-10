"""Marketplace API endpoints"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.models.marketplace import MarketplaceListing, MarketplaceListingCreate, MarketplaceListingUpdate
from app.services.marketplace_service import MarketplaceService
from sqlalchemy.orm import Session
from app.utils.database import get_db

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

# Initialize service
marketplace_service = MarketplaceService()

@router.get("/listings", response_model=List[MarketplaceListing])
async def list_listings(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 100
):
    """List marketplace listings with optional filtering"""
    filters = {
        "is_active": is_active
    }
    if category:
        filters["category"] = category
    if min_price is not None:
        filters["min_price"] = min_price
    if max_price is not None:
        filters["max_price"] = max_price
    
    listings = await marketplace_service.list_listings(
        filters=filters,
        skip=skip,
        limit=limit
    )
    return listings

@router.get("/listings/{listing_id}", response_model=MarketplaceListing)
async def get_listing(listing_id: int):
    """Get a specific listing by ID"""
    listing = await marketplace_service.get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing

@router.post("/listings", response_model=MarketplaceListing)
async def create_listing(listing: MarketplaceListingCreate):
    """Create a new marketplace listing"""
    return await marketplace_service.create_listing(listing.dict())

@router.put("/listings/{listing_id}", response_model=MarketplaceListing)
async def update_listing(listing_id: int, listing: MarketplaceListingUpdate):
    """Update a marketplace listing"""
    updated_listing = await marketplace_service.update_listing(
        listing_id, 
        listing.dict(exclude_unset=True)
    )
    if not updated_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return updated_listing

@router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: int):
    """Delete a marketplace listing"""
    success = await marketplace_service.delete_listing(listing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"message": "Listing deleted successfully"}

@router.get("/experts/{expert_id}/listings", response_model=List[MarketplaceListing])
async def get_expert_listings(expert_id: str):
    """Get all listings for a specific expert"""
    listings = await marketplace_service.get_expert_listings(expert_id)
    return listings
