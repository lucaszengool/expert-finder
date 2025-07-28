# Enhanced Outreach Service with Multi-Channel Support
import asyncio
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import uuid
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import ssl
from jinja2 import Template
import aiosmtplib
from cryptography.fernet import Fernet
import os

from ..models.outreach_db_models import (
    OutreachCampaign as DBCampaign,
    OutreachTarget as DBTarget,
    OutreachMessage as DBMessage,
    MessageTemplate as DBTemplate,
    CampaignAnalytics as DBAnalytics,
    ChannelCredential as DBChannelCredential,
    Conversation as DBConversation,
    ConversationFlow as DBConversationFlow,
    AutoResponse as DBAutoResponse,
    ABTest as DBABTest,
    ChannelEnum, MessageStatusEnum, CampaignGoalEnum
)
from ..models.outreach_enhanced import (
    OutreachCampaignEnhanced, OutreachTargetEnhanced,
    OutreachMessage, Channel, MessageStatus,
    CampaignAnalytics, MessageTemplate
)
from .social_media_service import SocialMediaService
from .ai_service import AIService
from ..services.search_service import SearchService

class OutreachEnhancedService:
    def __init__(self):
        self.social_service = SocialMediaService()
        self.ai_service = AIService()
        self.search_service = SearchService()
        self.encryption_key = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
        self.cipher = Fernet(self.encryption_key)
    
    # Campaign Management
    async def create_campaign(self, db: Session, campaign: OutreachCampaignEnhanced) -> Dict[str, Any]:
        """Create a new multi-channel campaign"""
        db_campaign = DBCampaign(
            id=campaign.id or str(uuid.uuid4()),
            user_id=campaign.user_id,
            name=campaign.name,
            description=campaign.description,
            goal=CampaignGoalEnum[campaign.goal.value],
            channels=[c.value for c in campaign.channels],
            conversation_flow_id=campaign.conversation_flow_id,
            search_criteria=campaign.search_criteria,
            targeting_rules=campaign.targeting_rules,
            personalization_config=campaign.personalization_config,
            scheduling_config=campaign.scheduling_config,
            ai_config=campaign.ai_config,
            budget=campaign.budget,
            daily_budget=campaign.daily_budget,
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            status=campaign.status
        )
        
        db.add(db_campaign)
        
        # Create analytics record
        db_analytics = DBAnalytics(
            campaign_id=db_campaign.id,
            total_targets=0,
            messages_sent={},
            delivery_rate={},
            open_rate={},
            response_rate={}
        )
        db.add(db_analytics)
        
        db.commit()
        db.refresh(db_campaign)
        
        return self._campaign_to_dict(db_campaign)
    
    async def list_campaigns(
        self, db: Session, user_id: str,
        status: Optional[str] = None,
        goal: Optional[CampaignGoalEnum] = None,
        channel: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List user's campaigns with filters"""
        query = db.query(DBCampaign).filter(DBCampaign.user_id == user_id)
        
        if status:
            query = query.filter(DBCampaign.status == status)
        if goal:
            query = query.filter(DBCampaign.goal == goal)
        if channel:
            query = query.filter(DBCampaign.channels.contains([channel]))
        
        campaigns = query.order_by(DBCampaign.created_at.desc()).all()
        return [self._campaign_to_dict(c) for c in campaigns]
    
    async def get_campaign(self, db: Session, campaign_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get campaign details"""
        campaign = db.query(DBCampaign).filter(
            and_(DBCampaign.id == campaign_id, DBCampaign.user_id == user_id)
        ).first()
        
        return self._campaign_to_dict(campaign) if campaign else None
    
    async def update_campaign_status(
        self, db: Session, campaign_id: str, status: str, user_id: str
    ) -> Dict[str, Any]:
        """Update campaign status"""
        campaign = db.query(DBCampaign).filter(
            and_(DBCampaign.id == campaign_id, DBCampaign.user_id == user_id)
        ).first()
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        campaign.status = status
        campaign.updated_at = datetime.utcnow()
        
        if status == "active" and not campaign.start_date:
            campaign.start_date = datetime.utcnow()
        elif status in ["completed", "cancelled"]:
            campaign.end_date = datetime.utcnow()
        
        db.commit()
        return {"campaign_id": campaign_id, "status": status}
    
    # Target Discovery and Management
    async def discover_targets(self, campaign_id: str, search_criteria: Dict[str, Any]) -> str:
        """Discover targets based on search criteria"""
        task_id = str(uuid.uuid4())
        
        # Run discovery in background
        asyncio.create_task(self._discover_targets_async(campaign_id, search_criteria, task_id))
        
        return task_id
    
    async def _discover_targets_async(
        self, campaign_id: str, search_criteria: Dict[str, Any], task_id: str
    ):
        """Async target discovery process"""
        try:
            # Use existing search service to find experts
            results = await self.search_service.search_experts(
                query=search_criteria.get("query", ""),
                filters=search_criteria.get("filters", {}),
                limit=search_criteria.get("limit", 100)
            )
            
            # Process and add targets
            targets_added = 0
            for expert in results.get("experts", []):
                target_data = self._expert_to_target(expert, campaign_id)
                if target_data:
                    # Add to database
                    await self._add_target_to_db(target_data)
                    targets_added += 1
            
            # Update campaign metrics
            await self._update_campaign_metrics(campaign_id, {"targets_discovered": targets_added})
            
        except Exception as e:
            print(f"Error in target discovery: {e}")
    
    def _expert_to_target(self, expert: Dict[str, Any], campaign_id: str) -> Optional[Dict[str, Any]]:
        """Convert expert data to target format"""
        channels = {}
        
        # Extract contact information
        for contact in expert.get("contacts", []):
            method = contact.get("method", "").lower()
            value = contact.get("value", "")
            
            if method == "email" and value:
                channels[Channel.EMAIL] = value
            elif method == "twitter" and value:
                channels[Channel.TWITTER] = value.split("/")[-1]
            elif method == "linkedin" and value:
                channels[Channel.LINKEDIN] = value
        
        if not channels:
            return None
        
        return {
            "campaign_id": campaign_id,
            "name": expert.get("name", ""),
            "company": expert.get("company"),
            "title": expert.get("title"),
            "location": expert.get("location"),
            "channels": channels,
            "profile_data": {
                "bio": expert.get("bio"),
                "skills": expert.get("skills", []),
                "experience_years": expert.get("experience_years"),
                "profile_image": expert.get("profile_image"),
                "profile_url": expert.get("profile_url")
            }
        }
    
    async def list_targets(
        self, db: Session, campaign_id: str, user_id: str,
        stage: Optional[str] = None, channel: Optional[Channel] = None,
        offset: int = 0, limit: int = 50
    ) -> Dict[str, Any]:
        """List campaign targets"""
        # Verify campaign ownership
        campaign = db.query(DBCampaign).filter(
            and_(DBCampaign.id == campaign_id, DBCampaign.user_id == user_id)
        ).first()
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        query = db.query(DBTarget).filter(DBTarget.campaign_id == campaign_id)
        
        if stage:
            query = query.filter(DBTarget.conversation_stage == stage)
        
        total = query.count()
        targets = query.offset(offset).limit(limit).all()
        
        return {
            "targets": [self._target_to_dict(t) for t in targets],
            "total": total,
            "offset": offset,
            "limit": limit
        }
    
    # Messaging
    async def queue_messages(
        self, db: Session, campaign_id: str,
        target_ids: List[str], channels: List[Channel],
        template_id: Optional[str] = None,
        personalize: bool = True,
        schedule_time: Optional[datetime] = None
    ) -> str:
        """Queue messages for sending"""
        job_id = str(uuid.uuid4())
        
        # Get targets
        targets = db.query(DBTarget).filter(
            and_(
                DBTarget.campaign_id == campaign_id,
                DBTarget.id.in_(target_ids)
            )
        ).all()
        
        # Get template if specified
        template = None
        if template_id:
            template = db.query(DBTemplate).filter(DBTemplate.id == template_id).first()
        
        # Create messages for each target and channel
        messages = []
        for target in targets:
            for channel in channels:
                # Check if target has this channel
                if channel.value not in target.channels:
                    continue
                
                # Create message
                content = await self._generate_message_content(
                    target, channel, template, personalize
                )
                
                message = DBMessage(
                    campaign_id=campaign_id,
                    target_id=target.id,
                    channel=ChannelEnum[channel.value],
                    content=content["body"],
                    subject=content.get("subject"),
                    scheduled_at=schedule_time,
                    status=MessageStatusEnum.QUEUED,
                    metadata={"job_id": job_id}
                )
                
                db.add(message)
                messages.append(message)
        
        db.commit()
        
        return job_id
    
    async def _generate_message_content(
        self, target: DBTarget, channel: Channel,
        template: Optional[DBTemplate], personalize: bool
    ) -> Dict[str, str]:
        """Generate personalized message content"""
        if template:
            # Use template
            content = template.content
            subject = template.subject
        else:
            # Generate with AI
            prompt = f"""
            Create a {channel.value} message for {target.name} who is a {target.title} at {target.company}.
            The message should be professional and engaging.
            """
            
            ai_response = await self.ai_service.generate_content(prompt)
            content = ai_response.get("content", "")
            subject = ai_response.get("subject", "")
        
        if personalize:
            # Personalize content
            template_engine = Template(content)
            personalized_content = template_engine.render(
                name=target.name,
                company=target.company,
                title=target.title,
                **target.custom_fields
            )
            
            if subject:
                subject_template = Template(subject)
                subject = subject_template.render(
                    name=target.name,
                    company=target.company
                )
        else:
            personalized_content = content
        
        return {"body": personalized_content, "subject": subject}
    
    async def process_message_queue(self, job_id: str):
        """Process queued messages"""
        db = Session()  # Get new session for async task
        
        try:
            # Get messages for this job
            messages = db.query(DBMessage).filter(
                and_(
                    DBMessage.metadata["job_id"] == job_id,
                    DBMessage.status == MessageStatusEnum.QUEUED
                )
            ).all()
            
            for message in messages:
                try:
                    # Send based on channel
                    if message.channel == ChannelEnum.EMAIL:
                        result = await self._send_email(db, message)
                    else:
                        result = await self._send_social_message(db, message)
                    
                    # Update message status
                    if result["success"]:
                        message.status = MessageStatusEnum.SENT
                        message.sent_at = datetime.utcnow()
                    else:
                        message.status = MessageStatusEnum.FAILED
                        message.metadata["error"] = result.get("error")
                    
                    db.commit()
                    
                    # Rate limiting
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    message.status = MessageStatusEnum.FAILED
                    message.metadata["error"] = str(e)
                    db.commit()
        
        finally:
            db.close()
    
    async def _send_email(self, db: Session, message: DBMessage) -> Dict[str, Any]:
        """Send email message"""
        # Get target
        target = db.query(DBTarget).filter(DBTarget.id == message.target_id).first()
        if not target:
            return {"success": False, "error": "Target not found"}
        
        # Get email credentials
        campaign = db.query(DBCampaign).filter(DBCampaign.id == message.campaign_id).first()
        creds = await self._get_channel_credentials(db, campaign.user_id, Channel.EMAIL)
        
        if not creds:
            return {"success": False, "error": "Email credentials not configured"}
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = creds.get("smtp_from", creds.get("smtp_user"))
            msg['To'] = target.channels.get("email")
            msg['Subject'] = message.subject or "Message for you"
            
            # Add tracking pixel
            tracking_id = str(uuid.uuid4())
            body_with_tracking = f"""
            {message.content}
            <img src="https://yourapi.com/track/open/{tracking_id}" width="1" height="1" />
            """
            
            msg.attach(MIMEText(body_with_tracking, 'html'))
            
            # Send via SMTP
            async with aiosmtplib.SMTP(
                hostname=creds["smtp_host"],
                port=creds.get("smtp_port", 587),
                use_tls=True
            ) as server:
                await server.login(creds["smtp_user"], creds["smtp_password"])
                await server.send_message(msg)
            
            return {"success": True, "tracking_id": tracking_id}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _send_social_message(self, db: Session, message: DBMessage) -> Dict[str, Any]:
        """Send social media message"""
        # Get target
        target = db.query(DBTarget).filter(DBTarget.id == message.target_id).first()
        if not target:
            return {"success": False, "error": "Target not found"}
        
        # Get channel credentials
        campaign = db.query(DBCampaign).filter(DBCampaign.id == message.campaign_id).first()
        creds = await self._get_channel_credentials(db, campaign.user_id, Channel(message.channel.value))
        
        if not creds:
            return {"success": False, "error": f"{message.channel.value} credentials not configured"}
        
        # Send via social media service
        recipient = target.channels.get(message.channel.value)
        if not recipient:
            return {"success": False, "error": f"No {message.channel.value} contact for target"}
        
        return await self.social_service.send_message(
            channel=message.channel.value,
            credentials=creds,
            recipient=recipient,
            message=message.content,
            media_urls=message.media_urls
        )
    
    # Channel Credentials
    async def store_channel_credentials(
        self, db: Session, user_id: str, channel: Channel, credentials: Dict[str, Any]
    ):
        """Store encrypted channel credentials"""
        # Encrypt sensitive data
        encrypted_creds = self.cipher.encrypt(json.dumps(credentials).encode()).decode()
        
        # Check if credentials exist
        existing = db.query(DBChannelCredential).filter(
            and_(
                DBChannelCredential.user_id == user_id,
                DBChannelCredential.channel == ChannelEnum[channel.value]
            )
        ).first()
        
        if existing:
            existing.credentials = {"encrypted": encrypted_creds}
            existing.updated_at = datetime.utcnow()
        else:
            new_creds = DBChannelCredential(
                user_id=user_id,
                channel=ChannelEnum[channel.value],
                credentials={"encrypted": encrypted_creds},
                is_active=True
            )
            db.add(new_creds)
        
        db.commit()
    
    async def _get_channel_credentials(
        self, db: Session, user_id: str, channel: Channel
    ) -> Optional[Dict[str, Any]]:
        """Get decrypted channel credentials"""
        creds = db.query(DBChannelCredential).filter(
            and_(
                DBChannelCredential.user_id == user_id,
                DBChannelCredential.channel == ChannelEnum[channel.value],
                DBChannelCredential.is_active == True
            )
        ).first()
        
        if not creds:
            return None
        
        # Decrypt credentials
        encrypted = creds.credentials.get("encrypted")
        if encrypted:
            decrypted = self.cipher.decrypt(encrypted.encode()).decode()
            return json.loads(decrypted)
        
        return None
    
    async def validate_channel_credentials(self, user_id: str, channel: Channel) -> bool:
        """Validate if user has valid credentials for channel"""
        db = Session()
        try:
            creds = await self._get_channel_credentials(db, user_id, channel)
            if not creds:
                return False
            
            return await self.social_service.validate_credentials(channel.value, creds)
        finally:
            db.close()
    
    # Analytics
    async def get_campaign_analytics(self, db: Session, campaign_id: str) -> Dict[str, Any]:
        """Get real-time campaign analytics"""
        analytics = db.query(DBAnalytics).filter(
            DBAnalytics.campaign_id == campaign_id
        ).first()
        
        if not analytics:
            return {}
        
        # Calculate additional metrics
        total_sent = sum(analytics.messages_sent.values())
        total_delivered = sum(
            analytics.messages_sent.get(ch, 0) * analytics.delivery_rate.get(ch, 0)
            for ch in analytics.messages_sent
        )
        
        return {
            "total_targets": analytics.total_targets,
            "total_sent": total_sent,
            "total_delivered": int(total_delivered),
            "overall_open_rate": sum(analytics.open_rate.values()) / len(analytics.open_rate) if analytics.open_rate else 0,
            "overall_response_rate": sum(analytics.response_rate.values()) / len(analytics.response_rate) if analytics.response_rate else 0,
            "conversion_rate": analytics.conversion_rate,
            "roi": analytics.roi,
            "by_channel": {
                channel: {
                    "sent": analytics.messages_sent.get(channel, 0),
                    "delivery_rate": analytics.delivery_rate.get(channel, 0),
                    "open_rate": analytics.open_rate.get(channel, 0),
                    "response_rate": analytics.response_rate.get(channel, 0)
                }
                for channel in analytics.messages_sent
            }
        }
    
    # Helper methods
    def _campaign_to_dict(self, campaign: DBCampaign) -> Dict[str, Any]:
        """Convert DB campaign to dict"""
        if not campaign:
            return {}
        
        return {
            "id": campaign.id,
            "user_id": campaign.user_id,
            "name": campaign.name,
            "description": campaign.description,
            "goal": campaign.goal.value,
            "channels": campaign.channels,
            "status": campaign.status,
            "metrics": campaign.metrics,
            "created_at": campaign.created_at.isoformat(),
            "updated_at": campaign.updated_at.isoformat()
        }
    
    def _target_to_dict(self, target: DBTarget) -> Dict[str, Any]:
        """Convert DB target to dict"""
        return {
            "id": target.id,
            "campaign_id": target.campaign_id,
            "name": target.name,
            "company": target.company,
            "title": target.title,
            "location": target.location,
            "channels": target.channels,
            "conversation_stage": target.conversation_stage.value,
            "lead_score": target.lead_score,
            "last_contacted_at": target.last_contacted_at.isoformat() if target.last_contacted_at else None
        }