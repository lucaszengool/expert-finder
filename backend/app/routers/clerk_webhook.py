from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import JSONResponse
from typing import Optional
import json
import os
from datetime import datetime
import logging
from svix.webhooks import Webhook, WebhookVerificationError

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Get the webhook secret from environment variables
WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

@router.post("/api/webhooks/clerk")
async def handle_clerk_webhook(
    request: Request,
    svix_id: Optional[str] = Header(None),
    svix_timestamp: Optional[str] = Header(None),
    svix_signature: Optional[str] = Header(None)
):
    """
    Handle Clerk webhook events
    """
    if not WEBHOOK_SECRET:
        logger.error("CLERK_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    # Get the body
    body = await request.body()
    
    # Verify the webhook signature using Svix
    try:
        wh = Webhook(WEBHOOK_SECRET)
        payload = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    except WebhookVerificationError as e:
        logger.error(f"Webhook verification failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=400, detail="Error processing webhook")
    
    # Handle different event types
    event_type = payload.get("type")
    data = payload.get("data", {})
    
    logger.info(f"Received Clerk webhook: {event_type}")
    
    try:
        if event_type == "user.created":
            await handle_user_created(data)
        elif event_type == "user.updated":
            await handle_user_updated(data)
        elif event_type == "user.deleted":
            await handle_user_deleted(data)
        elif event_type == "session.created":
            # Log new sessions if needed
            logger.info(f"New session created for user: {data.get('user_id')}")
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
    
    except Exception as e:
        logger.error(f"Error handling webhook event {event_type}: {str(e)}")
        # Return success anyway to prevent retries for non-critical errors
    
    return JSONResponse({"status": "success", "message": f"Processed {event_type}"})


async def handle_user_created(user_data: dict):
    """
    Handle new user creation - add to waitlist
    """
    user_id = user_data.get("id")
    email = user_data.get("email_addresses", [{}])[0].get("email_address")
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name", "")
    
    logger.info(f"New user created: {email} (ID: {user_id})")
    
    # Add user to your waitlist database
    # Example: await add_user_to_waitlist(user_id, email, first_name, last_name)
    
    # Check if email is in pre-approved list
    pre_approved_emails = os.getenv("PRE_APPROVED_EMAILS", "").split(",")
    if email in pre_approved_emails:
        # Auto-approve user
        logger.info(f"Auto-approving pre-approved user: {email}")
        # You would typically update the user's metadata here
        # This would require using Clerk's backend API
    
    # You can also store waitlist info in your own database
    waitlist_entry = {
        "clerk_user_id": user_id,
        "email": email,
        "name": f"{first_name} {last_name}".strip(),
        "joined_at": datetime.utcnow().isoformat(),
        "status": "pending",
        "position": await get_next_waitlist_position()  # Implement this based on your DB
    }
    
    # Save to your database
    # await save_waitlist_entry(waitlist_entry)


async def handle_user_updated(user_data: dict):
    """
    Handle user updates - check for metadata changes
    """
    user_id = user_data.get("id")
    public_metadata = user_data.get("public_metadata", {})
    
    # Check if user was granted access
    if public_metadata.get("hasAccess") or public_metadata.get("waitlistStatus") == "approved":
        logger.info(f"User {user_id} was granted access")
        # Update your database
        # await update_user_access_status(user_id, "approved")
    

async def handle_user_deleted(user_data: dict):
    """
    Handle user deletion
    """
    user_id = user_data.get("id")
    logger.info(f"User deleted: {user_id}")
    # Remove from waitlist if needed
    # await remove_from_waitlist(user_id)


async def get_next_waitlist_position() -> int:
    """
    Get the next position in the waitlist
    This is a placeholder - implement based on your database
    """
    # Example: return await db.waitlist.count() + 1
    return 1
