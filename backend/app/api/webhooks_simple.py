# Simple webhook handler for Railway deployment
from fastapi import APIRouter, Request
from typing import Dict, Any

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/email/sendgrid")
async def handle_sendgrid_webhook(request: Request):
    """Handle SendGrid webhook - simplified"""
    return {"status": "received"}

@router.post("/instagram/messages")
async def handle_instagram_webhook(request: Request):
    """Handle Instagram webhook - simplified"""
    return {"status": "received"}

@router.post("/whatsapp/messages")
async def handle_whatsapp_webhook(request: Request):
    """Handle WhatsApp webhook - simplified"""
    return {"status": "received"}

@router.post("/twitter/messages")
async def handle_twitter_webhook(request: Request):
    """Handle Twitter webhook - simplified"""
    return {"status": "received"}

@router.post("/generic/{channel}")
async def handle_generic_webhook(channel: str, request: Request):
    """Handle generic webhook - simplified"""
    return {"status": "received", "channel": channel}