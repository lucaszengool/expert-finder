import logging
import time
from functools import wraps
# from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Request
import json

# Metrics
request_count = Counter(
    'app_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'app_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

search_queries = Counter(
    'search_queries_total',
    'Total search queries',
    ['source']
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def log_request(request: Request, response_time: float, status_code: int):
    """Log request details"""
    log_data = {
        'timestamp': time.time(),
        'method': request.method,
        'path': request.url.path,
        'client_ip': request.client.host,
        'response_time': response_time,
        'status_code': status_code
    }
    
    logger.info(json.dumps(log_data))
    
    # Update metrics
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(response_time)

def monitor_performance(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {str(e)}")
            raise
    return wrapper
