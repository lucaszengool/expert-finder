from fastapi import HTTPException, Depends
import requests

async def verify_clerk_token(token: str):
    """Verify token with Clerk"""
    response = requests.get(
        "https://api.clerk.dev/v1/sessions/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json()