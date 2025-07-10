from functools import wraps
from fastapi import HTTPException
import time
from collections import defaultdict
import asyncio

class RateLimiter:
    def __init__(self):
        self.calls = defaultdict(list)
    
    def is_allowed(self, key: str, calls: int, period: int) -> bool:
        now = time.time()
        # Remove old calls
        self.calls[key] = [
            call_time for call_time in self.calls[key]
            if call_time > now - period
        ]
        
        # Check if limit exceeded
        if len(self.calls[key]) >= calls:
            return False
        
        # Add current call
        self.calls[key].append(now)
        return True

rate_limiter = RateLimiter()

def rate_limit(calls: int = 60, period: int = 60):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request')
            if request:
                client_ip = request.client.host
                if not rate_limiter.is_allowed(client_ip, calls, period):
                    raise HTTPException(
                        status_code=429,
                        detail="Rate limit exceeded"
                    )
            return await func(*args, **kwargs)
        return wrapper
    return decorator
