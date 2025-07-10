import redis
import json
import os
from typing import Optional, Dict, Any
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle datetime objects"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://redis:6379"),
    decode_responses=True
)

async def cache_result(key: str, data: Dict[Any, Any], ttl: int = 3600):
    """Cache search results"""
    try:
        redis_client.setex(
            key,
            ttl,
            json.dumps(data, cls=DateTimeEncoder)
        )
    except Exception as e:
        print(f"Cache error: {e}")

async def get_cached_result(key: str) -> Optional[Dict]:
    """Get cached result"""
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"Cache retrieval error: {e}")
    return None