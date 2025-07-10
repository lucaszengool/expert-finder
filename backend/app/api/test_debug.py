from fastapi import HTTPException

from fastapi import APIRouter
import os
import sys
import chromadb
from datetime import datetime

router = APIRouter(prefix="/api/test", tags=["test"])

@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "environment": os.getenv("ENVIRONMENT", "unknown")
    }

@router.get("/chromadb-test")
async def test_chromadb():
    """Test ChromaDB connection"""
    try:
        # Test ChromaDB with telemetry disabled
        client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=chromadb.Settings(anonymized_telemetry=False)
        )
        
        collections = client.list_collections()
        
        return {
            "status": "success",
            "collections": [col.name for col in collections],
            "path": "./chroma_db"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }

@router.get("/database-test")
async def test_database():
    """Test database connection"""
    try:
        from app.utils.database import SessionLocal
        
        db = SessionLocal()
        result = db.execute("SELECT 1").scalar()
        db.close()
        
        return {
            "status": "success",
            "result": result,
            "database_url": os.getenv("DATABASE_URL", "not set")[:30] + "..."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }

@router.post("/echo")
async def echo_test(data: dict):
    """Echo endpoint for testing"""
    return {
        "received": data,
        "timestamp": datetime.now().isoformat()
    }
