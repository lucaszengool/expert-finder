from fastapi import APIRouter, HTTPException, Depends
from app.utils.clerk_admin import grant_user_access, revoke_user_access, get_waitlist_users
from app.auth import require_admin  # Implement your admin auth

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/waitlist")
async def get_waitlist(
    limit: int = 100,
    offset: int = 0,
    # admin = Depends(require_admin)  # Add your admin auth
):
    """Get all users on the waitlist"""
    try:
        users = await get_waitlist_users(limit, offset)
        return {"users": users, "total": len(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/grant-access/{user_id}")
async def grant_access(
    user_id: str,
    # admin = Depends(require_admin)  # Add your admin auth
):
    """Grant a user access to the platform"""
    try:
        result = await grant_user_access(user_id)
        return {"message": "Access granted", "user": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/revoke-access/{user_id}")
async def revoke_access(
    user_id: str,
    # admin = Depends(require_admin)  # Add your admin auth
):
    """Revoke a user's access"""
    try:
        result = await revoke_user_access(user_id)
        return {"message": "Access revoked", "user": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))