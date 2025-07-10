content = '''from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Depends
from app.models.marketplace import MarketplaceOffering, Booking
from app.services.marketplace_service import MarketplaceService
from app.utils.auth import get_current_user

router = APIRouter()
marketplace_service = MarketplaceService()

@router.get("/offerings", response_model=List[MarketplaceOffering])
async def get_marketplace_offerings(
    skill: Optional[str] = None,
    type: Optional[str] = None,
    max_price: Optional[float] = None
):
    """Get available marketplace offerings"""
    return await marketplace_service.get_offerings(
        skill=skill,
        type=type,
        max_price=max_price
    )

@router.post("/offerings", response_model=MarketplaceOffering)
async def create_offering(
    offering: MarketplaceOffering,
    current_user = Depends(get_current_user)
):
    """Create a new marketplace offering"""
    return await marketplace_service.create_offering(offering, current_user.id)

@router.post("/bookings", response_model=Booking)
async def book_consultation(
    offering_id: str,
    scheduled_at: datetime,
    current_user = Depends(get_current_user)
):
    """Book a consultation"""
    return await marketplace_service.create_booking(
        offering_id=offering_id,
        client_id=current_user.id,
        scheduled_at=scheduled_at
    )
'''

with open('app/api/marketplace.py', 'w') as f:
    f.write(content)

print("Fixed marketplace.py")
