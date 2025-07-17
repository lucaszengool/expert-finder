from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import json
import os

router = APIRouter()

@router.post("/api/webhooks/clerk")
async def handle_clerk_webhook(request: Request):
    """Handle Clerk webhook events without Svix verification"""
    try:
        # Get the raw body
        body = await request.body()
        event = json.loads(body)
        
        # Log the webhook
        print(f"Received Clerk webhook: {event.get('type')}")
        
        # Handle different event types
        event_type = event.get("type")
        
        if event_type == "user.created":
            user_data = event.get("data")
            print(f"New user created: {user_data.get('id')}")
            # Add your user creation logic here
            
        elif event_type == "user.updated":
            user_data = event.get("data")
            print(f"User updated: {user_data.get('id')}")
            # Add your user update logic here
            
        # Return success
        return JSONResponse(content={"received": True}, status_code=200)
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid webhook")