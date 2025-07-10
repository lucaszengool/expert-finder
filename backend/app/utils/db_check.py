"""Database connection checker"""
import os
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

def get_database_url():
    """Get database URL based on environment"""
    # In Docker, use 'db' hostname; locally use localhost
    default_url = "postgresql://expertuser:expertpass@db:5432/expertdb"
    
    # For local testing, check if we're in Docker
    if not os.path.exists('/.dockerenv'):
        # Not in Docker, use localhost
        default_url = "postgresql://expertuser:expertpass@localhost:5432/expertdb"
    
    return os.getenv("DATABASE_URL", default_url)

def check_database_connection():
    """Check if database is accessible"""
    try:
        engine = create_engine(get_database_url())
        conn = engine.connect()
        conn.close()
        return True
    except OperationalError:
        return False
