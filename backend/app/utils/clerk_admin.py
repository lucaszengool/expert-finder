import httpx
import os
from typing import Optional, Dict, Any

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_API_URL = "https://api.clerk.com/v1"

async def update_user_metadata(user_id: str, public_metadata: Dict[str, Any], private_metadata: Optional[Dict[str, Any]] = None):
    """
    Update user metadata in Clerk
    """
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "public_metadata": public_metadata
    }
    
    if private_metadata:
        data["private_metadata"] = private_metadata
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{CLERK_API_URL}/users/{user_id}",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

async def grant_user_access(user_id: str):
    """
    Grant a user access to the platform
    """
    return await update_user_metadata(
        user_id,
        public_metadata={
            "hasAccess": True,
            "waitlistStatus": "approved",
            "approvedAt": datetime.utcnow().isoformat()
        }
    )

async def revoke_user_access(user_id: str):
    """
    Revoke a user's access
    """
    return await update_user_metadata(
        user_id,
        public_metadata={
            "hasAccess": False,
            "waitlistStatus": "revoked"
        }
    )

async def get_waitlist_users(limit: int = 100, offset: int = 0):
    """
    Get all users on the waitlist
    """
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CLERK_API_URL}/users",
            headers=headers,
            params={
                "limit": limit,
                "offset": offset
            }
        )
        response.raise_for_status()
        data = response.json()
        
        # Filter for waitlist users
        waitlist_users = [
            user for user in data
            if user.get("public_metadata", {}).get("waitlistStatus") == "pending"
        ]
        
        return waitlist_users