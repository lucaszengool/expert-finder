"""Database configuration and utilities"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

def get_database_url():
    """Get database URL based on environment"""
    # Check if we have a DATABASE_URL environment variable
    env_db_url = os.getenv("DATABASE_URL")
    
    # If running locally (not in Docker), use localhost
    if not os.path.exists('/.dockerenv') and env_db_url and "db:5432" in env_db_url:
        # Replace 'db' with 'localhost' for local development
        return env_db_url.replace("@db:", "@localhost:")
    
    # Default for local testing
    if not env_db_url:
        return "postgresql://expertuser:expertpass@localhost:5432/expertdb"
    
    return env_db_url

# Get database URL
DATABASE_URL = get_database_url()

# Create engine with pool settings to handle connection issues
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database"""
    try:
        # Import all models to ensure they're registered
        from app.models import expert, expert_dna, marketplace, search, user
        
        # Only create tables if we can connect
        if os.getenv("TESTING") != "true":
            Base.metadata.create_all(bind=engine)
            print("Database tables created successfully")
        
        # Initialize ChromaDB collections
        try:
            from app.services.vector_search import vector_search_service
            vector_search_service.init_collections()
        except Exception as e:
            print(f"⚠️ Warning: Vector search initialization failed: {e}")
            # Continue without vector search in deployment environments
            if not (os.getenv("TESTING") == "true" or os.getenv("RAILWAY_ENVIRONMENT_NAME")):
                raise
        
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Warning: Database initialization failed: {e}")
        if not (os.getenv("TESTING") == "true" or os.getenv("RAILWAY_ENVIRONMENT_NAME")):
            raise

# ChromaDB collection getter (for backward compatibility)
def get_collection(collection_name):
    """Get ChromaDB collection by name"""
    from app.services.vector_search import vector_search_service
    
    if collection_name == "linkedin_experts":
        return vector_search_service.linkedin_collection
    elif collection_name == "scholar_experts":
        return vector_search_service.scholar_collection
    else:
        raise ValueError(f"Unknown collection: {collection_name}")
