# Webhook handlers for real-time message processing
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from typing import Dict, Any, Optional
import hmac
import hashlib
import json
from datetime import datetime
import logging

from ..services.ai_response_service import AIResponseService
from ..services.outreach_enhanced_service import OutreachEnhancedService
from ..services.social_media_service import SocialMediaService
from ..utils.database import get_db

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# Initialize services
ai_service = AIResponseService()
outreach_service = OutreachEnhancedService()
social_service = SocialMediaService()

logger = logging.getLogger(__name__)

# Email webhook handlers
@router.post("/email/sendgrid")
async def handle_sendgrid_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle SendGrid email events (opens, clicks, replies)"""
    try:
        # Verify webhook signature
        signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature")
        if not await verify_sendgrid_signature(request, signature):
            raise HTTPException(401, "Invalid webhook signature")
        
        payload = await request.json()
        events = payload if isinstance(payload, list) else [payload]
        
        for event in events:
            background_tasks.add_task(
                process_email_event,
                event
            )
        
        return {"status": "received", "events": len(events)}
        
    except Exception as e:
        logger.error(f"SendGrid webhook error: {e}")
        raise HTTPException(500, "Webhook processing failed")

@router.post("/email/mailgun")
async def handle_mailgun_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle Mailgun email events"""
    try:
        # Verify webhook signature
        signature = request.headers.get("X-Mailgun-Signature-2")
        if not await verify_mailgun_signature(request, signature):
            raise HTTPException(401, "Invalid webhook signature")
        
        form_data = await request.form()
        event_data = dict(form_data)
        
        background_tasks.add_task(
            process_email_event,
            event_data,
            "mailgun"
        )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Mailgun webhook error: {e}")
        raise HTTPException(500, "Webhook processing failed")

# Social media webhook handlers
@router.post("/instagram/messages")
async def handle_instagram_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle Instagram/Facebook Messenger webhook"""
    try:
        # Verify webhook
        if request.method == "GET":
            # Webhook verification
            verify_token = request.query_params.get("hub.verify_token")
            challenge = request.query_params.get("hub.challenge")
            
            if verify_token == "your_verify_token":  # Replace with your token
                return int(challenge)
            
            raise HTTPException(403, "Invalid verify token")
        
        # Process message
        payload = await request.json()
        
        if payload.get("object") == "page":
            for entry in payload.get("entry", []):
                for messaging in entry.get("messaging", []):
                    if "message" in messaging:
                        background_tasks.add_task(
                            process_social_message,
                            "instagram",
                            messaging
                        )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Instagram webhook error: {e}")
        raise HTTPException(500, "Webhook processing failed")

@router.post("/whatsapp/messages")
async def handle_whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle WhatsApp Business API webhook"""
    try:
        payload = await request.json()
        
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                if change.get("field") == "messages":
                    value = change.get("value", {})
                    for message in value.get("messages", []):
                        background_tasks.add_task(
                            process_social_message,
                            "whatsapp",
                            message
                        )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        raise HTTPException(500, "Webhook processing failed")

@router.post("/twitter/messages")
async def handle_twitter_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle Twitter/X Direct Messages webhook"""
    try:
        # Verify Twitter webhook signature
        signature = request.headers.get("X-Twitter-Webhooks-Signature")
        if not await verify_twitter_signature(request, signature):
            raise HTTPException(401, "Invalid webhook signature")
        
        payload = await request.json()
        
        # Process direct messages
        if "direct_message_events" in payload:
            for dm in payload["direct_message_events"]:
                if dm.get("type") == "message_create":
                    background_tasks.add_task(
                        process_social_message,
                        "twitter",
                        dm
                    )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Twitter webhook error: {e}")
        raise HTTPException(500, "Webhook processing failed")

# Generic webhook processor
@router.post("/generic/{channel}")
async def handle_generic_webhook(
    channel: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle generic webhooks for any channel"""
    try:
        payload = await request.json()
        
        # Basic payload validation
        if not payload.get("message") or not payload.get("sender"):
            raise HTTPException(400, "Invalid payload structure")
        
        background_tasks.add_task(
            process_social_message,
            channel,
            payload
        )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Generic webhook error for {channel}: {e}")
        raise HTTPException(500, "Webhook processing failed")

# Background task processors
async def process_email_event(event_data: Dict[str, Any], provider: str = "sendgrid"):
    """Process email events (opens, clicks, replies)"""
    try:
        db = next(get_db())
        
        # Extract event information
        event_type = event_data.get("event") or event_data.get("event-data", {}).get("event")
        email = event_data.get("email") or event_data.get("recipient")
        timestamp = event_data.get("timestamp")
        
        if not email or not event_type:
            logger.warning(f"Incomplete email event data: {event_data}")
            return
        
        # Find related campaign and message
        message_info = await outreach_service.find_message_by_email(db, email)
        if not message_info:
            logger.info(f"No matching campaign found for email: {email}")
            return
        
        # Update message status based on event
        await update_message_status(db, message_info, event_type, timestamp)
        
        # If it's a reply, process with AI
        if event_type in ["replied", "bounce"] and event_data.get("text"):
            await ai_service.process_incoming_message(
                message_info["campaign_id"],
                message_info["target_id"],
                {
                    "channel": "email",
                    "content": event_data.get("text", ""),
                    "sender_id": email,
                    "timestamp": timestamp
                }
            )
        
        logger.info(f"Processed email event: {event_type} for {email}")
        
    except Exception as e:
        logger.error(f"Error processing email event: {e}")
    finally:
        db.close()

async def process_social_message(channel: str, message_data: Dict[str, Any]):
    """Process incoming social media messages"""
    try:
        db = next(get_db())
        
        # Extract message information based on channel
        if channel == "instagram":
            sender_id = message_data.get("sender", {}).get("id")
            message_text = message_data.get("message", {}).get("text", "")
            timestamp = message_data.get("timestamp")
        elif channel == "whatsapp":
            sender_id = message_data.get("from")
            message_text = message_data.get("text", {}).get("body", "")
            timestamp = message_data.get("timestamp")
        elif channel == "twitter":
            message_create = message_data.get("message_create", {})
            sender_id = message_create.get("sender_id")
            message_text = message_create.get("message_data", {}).get("text", "")
            timestamp = message_data.get("created_timestamp")
        else:
            # Generic format
            sender_id = message_data.get("sender")
            message_text = message_data.get("message", "")
            timestamp = message_data.get("timestamp")
        
        if not sender_id or not message_text:
            logger.warning(f"Incomplete {channel} message data: {message_data}")
            return
        
        # Find related campaign and target
        campaign_target = await outreach_service.find_campaign_target(
            db, channel, sender_id
        )
        
        if not campaign_target:
            logger.info(f"No matching campaign found for {channel} user: {sender_id}")
            return
        
        # Process with AI agent
        await ai_service.process_incoming_message(
            campaign_target["campaign_id"],
            campaign_target["target_id"],
            {
                "channel": channel,
                "content": message_text,
                "sender_id": sender_id,
                "timestamp": timestamp or datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Processed {channel} message from {sender_id}")
        
    except Exception as e:
        logger.error(f"Error processing {channel} message: {e}")
    finally:
        db.close()

async def update_message_status(db, message_info: Dict[str, Any], event_type: str, timestamp: str):
    """Update message status based on webhook event"""
    from ..models.outreach_db_models import OutreachMessage, MessageStatusEnum
    
    message = db.query(OutreachMessage).filter(
        OutreachMessage.id == message_info["message_id"]
    ).first()
    
    if not message:
        return
    
    # Map event types to status
    status_mapping = {
        "delivered": MessageStatusEnum.DELIVERED,
        "opened": MessageStatusEnum.READ,
        "clicked": MessageStatusEnum.READ,
        "replied": MessageStatusEnum.REPLIED,
        "bounced": MessageStatusEnum.BOUNCED,
        "failed": MessageStatusEnum.FAILED
    }
    
    new_status = status_mapping.get(event_type)
    if new_status:
        message.status = new_status
        
        # Update timestamps
        if event_type == "delivered":
            message.delivered_at = datetime.fromisoformat(timestamp)
        elif event_type in ["opened", "clicked"]:
            message.read_at = datetime.fromisoformat(timestamp)
        elif event_type == "replied":
            message.replied_at = datetime.fromisoformat(timestamp)
        
        db.commit()

# Signature verification functions
async def verify_sendgrid_signature(request: Request, signature: str) -> bool:
    """Verify SendGrid webhook signature"""
    try:
        webhook_secret = "your_sendgrid_webhook_secret"  # Replace with actual secret
        body = await request.body()
        
        expected_signature = hmac.new(
            webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    except:
        return False

async def verify_mailgun_signature(request: Request, signature: str) -> bool:
    """Verify Mailgun webhook signature"""
    try:
        webhook_secret = "your_mailgun_webhook_secret"  # Replace with actual secret
        body = await request.body()
        
        # Mailgun signature verification logic
        # This would need to be implemented based on Mailgun's documentation
        return True  # Placeholder
    except:
        return False

async def verify_twitter_signature(request: Request, signature: str) -> bool:
    """Verify Twitter webhook signature"""
    try:
        webhook_secret = "your_twitter_webhook_secret"  # Replace with actual secret
        body = await request.body()
        
        expected_signature = hmac.new(
            webhook_secret.encode(),
            body,
            hashlib.sha256
        ).digest()
        
        import base64
        expected_signature_b64 = base64.b64encode(expected_signature).decode()
        
        return hmac.compare_digest(signature, f"sha256={expected_signature_b64}")
    except:
        return False

# Webhook management endpoints
@router.post("/configure")
async def configure_webhook(webhook_config: Dict[str, Any]):
    """Configure webhook settings for a campaign"""
    try:
        db = next(get_db())
        
        # Store webhook configuration
        result = await outreach_service.configure_webhook(db, webhook_config)
        
        return {"status": "configured", "webhook_id": result["id"]}
        
    except Exception as e:
        logger.error(f"Webhook configuration error: {e}")
        raise HTTPException(500, "Failed to configure webhook")
    finally:
        db.close()

@router.get("/status/{webhook_id}")
async def get_webhook_status(webhook_id: str):
    """Get webhook status and recent events"""
    try:
        db = next(get_db())
        
        status = await outreach_service.get_webhook_status(db, webhook_id)
        
        return status
        
    except Exception as e:
        logger.error(f"Get webhook status error: {e}")
        raise HTTPException(500, "Failed to get webhook status")
    finally:
        db.close()