# backend/app/api/outreach.py
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.outreach import (
    OutreachCampaignCreate, OutreachCampaign,
    EmailExample, EmailTemplate,
    BulkOutreachRequest, OutreachAnalytics,
    OutreachTarget, ScheduledMeeting
)
from app.services.enhanced_multi_search_service import enhanced_multi_search_service
from app.services.email_learning_service import email_learning_service
from app.services.outreach_automation_service import outreach_automation_service
from app.utils.database import get_db

router = APIRouter(prefix="/api/outreach", tags=["outreach"])

@router.post("/campaigns", response_model=OutreachCampaign)
async def create_campaign(
    campaign_data: OutreachCampaignCreate,
    search_query: str,
    target_type: str,
    location: Optional[str] = None,
    industry: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Create a new outreach campaign with targets"""
    try:
        # Search for targets
        search_results = await enhanced_multi_search_service.search_targets(
            query=search_query,
            target_type=target_type,
            location=location,
            industry=industry,
            limit=limit
        )
        
        # Create campaign with targets
        campaign = await outreach_automation_service.create_campaign(
            campaign_data.dict(),
            search_results['targets'],
            db
        )
        
        return campaign
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaigns", response_model=List[OutreachCampaign])
async def list_campaigns(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all outreach campaigns"""
    query = db.query(OutreachCampaignDB)
    
    if status:
        query = query.filter(OutreachCampaignDB.status == status)
    
    campaigns = query.offset(skip).limit(limit).all()
    return [OutreachCampaign.from_orm(c) for c in campaigns]

@router.get("/campaigns/{campaign_id}", response_model=OutreachCampaign)
async def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    """Get campaign details"""
    campaign = db.query(OutreachCampaignDB).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return OutreachCampaign.from_orm(campaign)

@router.get("/campaigns/{campaign_id}/targets", response_model=List[OutreachTarget])
async def get_campaign_targets(
    campaign_id: str,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get targets for a campaign"""
    query = db.query(OutreachTargetDB).filter_by(campaign_id=campaign_id)
    
    if status:
        query = query.filter(OutreachTargetDB.status == status)
    
    targets = query.offset(skip).limit(limit).all()
    return [OutreachTarget.from_orm(t) for t in targets]

@router.post("/campaigns/{campaign_id}/send-bulk")
async def send_bulk_outreach(
    campaign_id: str,
    request: BulkOutreachRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send bulk personalized emails"""
    try:
        # Start sending in background
        background_tasks.add_task(
            outreach_automation_service.send_bulk_outreach,
            campaign_id,
            request.target_ids,
            request.template_id,
            request.personalization_level,
            request.delay_between_emails,
            db
        )
        
        return {
            "message": "Bulk outreach started",
            "campaign_id": campaign_id,
            "target_count": len(request.target_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaigns/{campaign_id}/targets/{target_id}/send")
async def send_single_outreach(
    campaign_id: str,
    target_id: str,
    template_id: Optional[str] = None,
    personalization_level: str = "high",
    db: Session = Depends(get_db)
):
    """Send personalized email to a single target"""
    try:
        result = await outreach_automation_service._send_outreach_email(
            campaign_id,
            target_id,
            template_id,
            personalization_level,
            db
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/email-templates/learn", response_model=EmailTemplate)
async def learn_from_emails(
    examples: List[EmailExample],
    db: Session = Depends(get_db)
):
    """Learn from email examples to create a template"""
    try:
        if len(examples) < 1:
            raise HTTPException(
                status_code=400,
                detail="At least one email example is required"
            )
        
        template = await email_learning_service.learn_from_examples(examples, db)
        return template
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-templates", response_model=List[EmailTemplate])
async def list_templates(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List email templates"""
    query = db.query(EmailTemplateDB)
    
    if category:
        query = query.filter(EmailTemplateDB.category == category)
    
    # Order by success rate
    templates = query.order_by(
        EmailTemplateDB.success_rate.desc()
    ).offset(skip).limit(limit).all()
    
    return [EmailTemplate.from_orm(t) for t in templates]

@router.post("/emails/{email_id}/response")
async def process_email_response(
    email_id: str,
    response_content: str,
    db: Session = Depends(get_db)
):
    """Process an email response and determine next action"""
    try:
        result = await outreach_automation_service.process_email_response(
            email_id,
            response_content,
            db
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/negotiations/{negotiation_id}/response")
async def handle_negotiation_response(
    negotiation_id: str,
    response: str,
    db: Session = Depends(get_db)
):
    """Handle negotiation response and generate strategy"""
    try:
        result = await outreach_automation_service.handle_negotiation(
            negotiation_id,
            response,
            db
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/meetings/schedule", response_model=ScheduledMeeting)
async def schedule_meeting(
    thread_id: str,
    meeting_details: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Schedule a meeting from email thread"""
    try:
        meeting = await outreach_automation_service.schedule_meeting_from_email(
            thread_id,
            meeting_details,
            db
        )
        
        return meeting
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaigns/{campaign_id}/analytics", response_model=OutreachAnalytics)
async def get_campaign_analytics(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    """Get campaign analytics"""
    # Get campaign
    campaign = db.query(OutreachCampaignDB).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Calculate analytics
    targets = db.query(OutreachTargetDB).filter_by(campaign_id=campaign_id).all()
    emails_sent = db.query(OutreachEmailDB).filter_by(
        campaign_id=campaign_id,
        direction='sent'
    ).count()
    
    opened = db.query(OutreachEmailDB).filter_by(
        campaign_id=campaign_id,
        direction='sent'
    ).filter(OutreachEmailDB.opened_at.isnot(None)).count()
    
    replied = db.query(OutreachEmailDB).filter_by(
        campaign_id=campaign_id,
        direction='sent'
    ).filter(OutreachEmailDB.replied_at.isnot(None)).count()
    
    meetings_scheduled = sum(1 for t in targets if t.status == 'meeting_scheduled')
    closed_won = sum(1 for t in targets if t.status == 'closed_won')
    
    # Calculate rates
    open_rate = (opened / emails_sent * 100) if emails_sent > 0 else 0
    response_rate = (replied / emails_sent * 100) if emails_sent > 0 else 0
    meeting_rate = (meetings_scheduled / len(targets) * 100) if targets else 0
    close_rate = (closed_won / len(targets) * 100) if targets else 0
    
    # Calculate average deal size from closed deals
    # This would need to be tracked in the negotiation records
    avg_deal_size = 0  # Placeholder
    
    return OutreachAnalytics(
        campaign_id=campaign_id,
        total_targets=len(targets),
        emails_sent=emails_sent,
        open_rate=open_rate,
        response_rate=response_rate,
        meeting_scheduled_rate=meeting_rate,
        closed_won_rate=close_rate,
        average_deal_size=avg_deal_size
    )

@router.post("/search-targets")
async def search_targets(
    query: str,
    target_type: str = "all",
    location: Optional[str] = None,
    industry: Optional[str] = None,
    size: Optional[str] = None,
    limit: int = 50
):
    """Search for outreach targets"""
    try:
        results = await enhanced_multi_search_service.search_targets(
            query=query,
            target_type=target_type,
            location=location,
            industry=industry,
            size=size,
            limit=limit
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/follow-up-suggestions/{campaign_id}/{target_id}")
async def get_follow_up_suggestions(
    campaign_id: str,
    target_id: str,
    db: Session = Depends(get_db)
):
    """Get follow-up suggestions for a target"""
    try:
        suggestions = await outreach_automation_service.generate_follow_up_sequence(
            campaign_id,
            target_id,
            db
        )
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))