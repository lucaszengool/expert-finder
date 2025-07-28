# Enhanced outreach API endpoints
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
from sqlalchemy.orm import Session

from ..models.outreach_enhanced import (
    OutreachCampaignEnhanced, OutreachTargetEnhanced, OutreachMessage,
    Channel, CampaignGoal, ConversationFlow, AIAgentConfig,
    MessageTemplate, CampaignAnalytics, AutoResponse, WebhookConfig
)
from ..services.outreach_enhanced_service import OutreachEnhancedService
from ..services.social_media_service import SocialMediaService
from ..services.ai_response_service import AIResponseService
from ..utils.database import get_db
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/outreach/v2", tags=["Outreach V2"])

# Initialize services
outreach_service = OutreachEnhancedService()
social_service = SocialMediaService()
ai_service = AIResponseService()

# Campaign Management
@router.post("/campaigns", response_model=OutreachCampaignEnhanced)
async def create_campaign(
    campaign: OutreachCampaignEnhanced,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new multi-channel outreach campaign"""
    campaign.user_id = current_user["id"]
    
    # Validate channel credentials
    for channel in campaign.channels:
        if not await outreach_service.validate_channel_credentials(current_user["id"], channel):
            raise HTTPException(400, f"Invalid or missing credentials for {channel}")
    
    # Create campaign
    db_campaign = await outreach_service.create_campaign(db, campaign)
    
    # Initialize AI agent if configured
    if campaign.ai_config:
        ai_agent = AIAgentConfig(
            campaign_id=db_campaign.id,
            **campaign.ai_config
        )
        await ai_service.create_agent(db, ai_agent)
    
    # Start target discovery in background
    if campaign.search_criteria:
        background_tasks.add_task(
            outreach_service.discover_targets,
            db_campaign.id,
            campaign.search_criteria
        )
    
    return db_campaign

@router.get("/campaigns", response_model=List[OutreachCampaignEnhanced])
async def list_campaigns(
    status: Optional[str] = None,
    goal: Optional[CampaignGoal] = None,
    channel: Optional[Channel] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's campaigns with optional filters"""
    return await outreach_service.list_campaigns(
        db, 
        current_user["id"],
        status=status,
        goal=goal,
        channel=channel
    )

@router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get campaign details with real-time analytics"""
    campaign = await outreach_service.get_campaign(db, campaign_id, current_user["id"])
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    
    # Add real-time analytics
    analytics = await outreach_service.get_campaign_analytics(db, campaign_id)
    campaign["analytics"] = analytics
    
    return campaign

@router.put("/campaigns/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: str,
    status: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start, pause, or stop a campaign"""
    return await outreach_service.update_campaign_status(
        db, campaign_id, status, current_user["id"]
    )

# Target Management
@router.post("/campaigns/{campaign_id}/targets/discover")
async def discover_targets(
    campaign_id: str,
    search_criteria: Dict[str, Any],
    limit: int = Query(100, le=1000),
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discover and add targets based on search criteria"""
    # Verify campaign ownership
    campaign = await outreach_service.get_campaign(db, campaign_id, current_user["id"])
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    
    # Start discovery process
    task_id = await outreach_service.start_target_discovery(
        db, campaign_id, search_criteria, limit
    )
    
    return {
        "task_id": task_id,
        "status": "discovering",
        "message": f"Discovering up to {limit} targets"
    }

@router.get("/campaigns/{campaign_id}/targets")
async def list_targets(
    campaign_id: str,
    stage: Optional[str] = None,
    channel: Optional[Channel] = None,
    offset: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List campaign targets with filters"""
    return await outreach_service.list_targets(
        db, campaign_id, current_user["id"],
        stage=stage, channel=channel,
        offset=offset, limit=limit
    )

@router.post("/campaigns/{campaign_id}/targets")
async def add_target(
    campaign_id: str,
    target: OutreachTargetEnhanced,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually add a target to campaign"""
    target.campaign_id = campaign_id
    return await outreach_service.add_target(db, target, current_user["id"])

# Messaging
@router.post("/campaigns/{campaign_id}/messages/send")
async def send_messages(
    campaign_id: str,
    target_ids: List[str],
    channels: List[Channel],
    template_id: Optional[str] = None,
    personalize: bool = True,
    schedule_time: Optional[datetime] = None,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send messages to targets across multiple channels"""
    # Verify campaign ownership
    campaign = await outreach_service.get_campaign(db, campaign_id, current_user["id"])
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    
    # Queue messages
    job_id = await outreach_service.queue_messages(
        db, campaign_id, target_ids, channels,
        template_id=template_id,
        personalize=personalize,
        schedule_time=schedule_time
    )
    
    # Start sending in background
    if not schedule_time or schedule_time <= datetime.utcnow():
        background_tasks.add_task(
            outreach_service.process_message_queue,
            job_id
        )
    
    return {
        "job_id": job_id,
        "targets": len(target_ids),
        "channels": channels,
        "status": "queued" if schedule_time else "sending"
    }

@router.get("/campaigns/{campaign_id}/messages")
async def list_messages(
    campaign_id: str,
    target_id: Optional[str] = None,
    channel: Optional[Channel] = None,
    status: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List campaign messages with filters"""
    return await outreach_service.list_messages(
        db, campaign_id, current_user["id"],
        target_id=target_id, channel=channel, status=status,
        offset=offset, limit=limit
    )

# AI Response Handling
@router.post("/webhooks/{channel}/message")
async def handle_incoming_message(
    channel: Channel,
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Handle incoming messages from various channels"""
    # Validate webhook signature based on channel
    if not await outreach_service.validate_webhook(channel, payload):
        raise HTTPException(401, "Invalid webhook signature")
    
    # Extract message details
    message_data = await outreach_service.parse_webhook_payload(channel, payload)
    
    # Find related campaign and target
    campaign_target = await outreach_service.find_campaign_target(
        db, channel, message_data["sender_id"]
    )
    
    if campaign_target:
        # Process with AI agent
        background_tasks.add_task(
            ai_service.process_incoming_message,
            campaign_target["campaign_id"],
            campaign_target["target_id"],
            message_data
        )
    
    return {"status": "received"}

@router.post("/campaigns/{campaign_id}/ai-agent/configure")
async def configure_ai_agent(
    campaign_id: str,
    config: AIAgentConfig,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configure AI agent for automated responses"""
    config.campaign_id = campaign_id
    return await ai_service.configure_agent(db, config, current_user["id"])

# Templates
@router.post("/templates")
async def create_template(
    template: MessageTemplate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a message template"""
    template.user_id = current_user["id"]
    return await outreach_service.create_template(db, template)

@router.get("/templates")
async def list_templates(
    channel: Optional[Channel] = None,
    goal: Optional[CampaignGoal] = None,
    stage: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List available templates"""
    return await outreach_service.list_templates(
        db, current_user["id"],
        channel=channel, goal=goal, stage=stage
    )

# Analytics
@router.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(
    campaign_id: str,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed campaign analytics"""
    return await outreach_service.get_detailed_analytics(
        db, campaign_id, current_user["id"],
        date_from=date_from, date_to=date_to
    )

@router.get("/campaigns/{campaign_id}/analytics/export")
async def export_analytics(
    campaign_id: str,
    format: str = Query("csv", regex="^(csv|excel|pdf)$"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export campaign analytics"""
    file_path = await outreach_service.export_analytics(
        db, campaign_id, current_user["id"], format
    )
    
    return {
        "download_url": f"/api/files/download/{file_path}",
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }

# Channel Configuration
@router.post("/channels/{channel}/connect")
async def connect_channel(
    channel: Channel,
    credentials: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect a communication channel"""
    # Validate credentials based on channel
    is_valid = await social_service.validate_credentials(channel, credentials)
    if not is_valid:
        raise HTTPException(400, "Invalid credentials")
    
    # Store encrypted credentials
    await outreach_service.store_channel_credentials(
        db, current_user["id"], channel, credentials
    )
    
    return {"status": "connected", "channel": channel}

@router.get("/channels")
async def list_connected_channels(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's connected channels"""
    return await outreach_service.list_user_channels(db, current_user["id"])

# Conversation Flows
@router.post("/conversation-flows")
async def create_conversation_flow(
    flow: ConversationFlow,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a goal-based conversation flow"""
    return await outreach_service.create_conversation_flow(db, flow, current_user["id"])

@router.get("/conversation-flows")
async def list_conversation_flows(
    goal: Optional[CampaignGoal] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List available conversation flows"""
    return await outreach_service.list_conversation_flows(
        db, current_user["id"], goal=goal
    )

# Auto-responses
@router.post("/campaigns/{campaign_id}/auto-responses")
async def create_auto_response(
    campaign_id: str,
    response: AutoResponse,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an automated response rule"""
    response.campaign_id = campaign_id
    return await outreach_service.create_auto_response(
        db, response, current_user["id"]
    )

# A/B Testing
@router.post("/campaigns/{campaign_id}/ab-tests")
async def create_ab_test(
    campaign_id: str,
    test_config: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an A/B test for campaign optimization"""
    return await outreach_service.create_ab_test(
        db, campaign_id, test_config, current_user["id"]
    )

@router.get("/campaigns/{campaign_id}/ab-tests/{test_id}/results")
async def get_ab_test_results(
    campaign_id: str,
    test_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get A/B test results and recommendations"""
    return await outreach_service.get_ab_test_results(
        db, test_id, current_user["id"]
    )