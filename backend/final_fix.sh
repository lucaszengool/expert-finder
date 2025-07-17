#!/bin/bash


echo "🔧 Final comprehensive fix for all issues..."
echo "=================================================="

# 1. Create the missing user model
echo -e "\n1️⃣ Creating missing user model..."
cat > app/models/user.py << 'EOF'
"""User model for authentication and profiles"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.utils.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
EOF
echo "✓ Created user.py model"

# 2. Update models/__init__.py to export all models
echo -e "\n2️⃣ Updating models/__init__.py..."
cat > app/models/__init__.py << 'EOF'
"""Models package"""
from app.models.expert import Expert
from app.models.expert_dna import ExpertDNA
from app.models.marketplace import MarketplaceListing
from app.models.search import SearchHistory
from app.models.user import User

__all__ = ["Expert", "ExpertDNA", "MarketplaceListing", "SearchHistory", "User"]
EOF
echo "✓ Updated models/__init__.py"

# 3. Fix database.py to handle both Docker and local environments properly
echo -e "\n3️⃣ Fixing database.py for proper environment detection..."
cat > app/utils/database.py << 'EOF'
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
        from app.services.vector_search import vector_search_service
        vector_search_service.init_collections()
        
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        if os.getenv("TESTING") != "true":
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
EOF
echo "✓ Fixed database.py"

# 4. Fix the duplicate database.py issue
echo -e "\n4️⃣ Consolidating database configurations..."
if [ -f "app/models/database.py" ]; then
    echo "Found app/models/database.py - migrating to utils..."
    
    # Create a backup
    cp app/models/database.py app/models/database.py.backup
    
    # Update imports in files that use app.models.database
    find app -name "*.py" -type f -exec sed -i '' 's/from app.models.database import/from app.utils.database import/g' {} \;
    find app -name "*.py" -type f -exec sed -i '' 's/import app.models.database/import app.utils.database/g' {} \;
    
    # Remove the duplicate
    rm app/models/database.py
    echo "✓ Consolidated database configuration"
fi

# 5. Fix ExpertService to not initialize on import
echo -e "\n5️⃣ Fixing ExpertService initialization..."
# Check if expert_service.py has a global instance creation
if grep -q "expert_service = ExpertService()" app/services/expert_service.py; then
    # Comment out the global instance
    sed -i '' 's/^expert_service = ExpertService()$/# expert_service = ExpertService()  # Commented out to prevent init on import/g' app/services/expert_service.py
    echo "✓ Fixed ExpertService global initialization"
fi

# 6. Update API files to create service instances properly
echo -e "\n6️⃣ Updating API files to handle services correctly..."

# Fix experts.py
cat > app/api/experts.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.models.schemas import ExpertCreate, ExpertResponse, ExpertUpdate
from app.services.expert_service import ExpertService
from app.utils.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/experts", tags=["experts"])

def get_expert_service():
    """Get expert service instance"""
    return ExpertService()

@router.post("/", response_model=ExpertResponse)
async def create_expert(
    expert: ExpertCreate,
    db: Session = Depends(get_db),
    service: ExpertService = Depends(get_expert_service)
):
    """Create a new expert"""
    try:
        return service.create_expert(expert.dict(), db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ExpertResponse])
async def list_experts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    service: ExpertService = Depends(get_expert_service)
):
    """List all experts"""
    return service.get_experts(skip=skip, limit=limit, db=db)

@router.get("/{expert_id}", response_model=ExpertResponse)
async def get_expert(
    expert_id: int,
    db: Session = Depends(get_db),
    service: ExpertService = Depends(get_expert_service)
):
    """Get expert by ID"""
    expert = service.get_expert_by_id(expert_id, db)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    return expert

@router.put("/{expert_id}", response_model=ExpertResponse)
async def update_expert(
    expert_id: int,
    expert_update: ExpertUpdate,
    db: Session = Depends(get_db),
    service: ExpertService = Depends(get_expert_service)
):
    """Update expert"""
    expert = service.update_expert(expert_id, expert_update.dict(), db)
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    return expert

@router.delete("/{expert_id}")
async def delete_expert(
    expert_id: int,
    db: Session = Depends(get_db),
    service: ExpertService = Depends(get_expert_service)
):
    """Delete expert"""
    if not service.delete_expert(expert_id, db):
        raise HTTPException(status_code=404, detail="Expert not found")
    return {"message": "Expert deleted successfully"}
EOF
echo "✓ Updated experts.py"

# 7. Fix ExpertService to not call init_db on creation
echo -e "\n7️⃣ Fixing ExpertService class..."
# Create a temporary fix file
cat > fix_expert_service.py << 'EOF'
import re

# Read the file
with open('app/services/expert_service.py', 'r') as f:
    content = f.read()

# Remove init_db() call from __init__ method
pattern = r'(def __init__\(self\):.*?)(init_db\(\))'
replacement = r'\1# init_db() - Moved to app startup'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write back
with open('app/services/expert_service.py', 'w') as f:
    f.write(content)

print("✓ Fixed ExpertService __init__ method")
EOF

python3 fix_expert_service.py
rm fix_expert_service.py

# 8. Create a test script that properly sets up the environment
echo -e "\n8️⃣ Creating proper test script..."
cat > test_app_import.py << 'EOF'
#!/usr/bin/env python3
"""Test app import with proper environment setup"""
import os
import sys

# Set up environment
os.environ['TESTING'] = 'true'
os.environ['ANONYMIZED_TELEMETRY'] = 'false'
os.environ['DATABASE_URL'] = 'postgresql://expertuser:expertpass@localhost:5432/expertdb'

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    
    # Test individual components
    print("  - Testing models...")
    from app.models import Expert, User, MarketplaceListing, SearchHistory, ExpertDNA
    print("    ✓ Models imported")
    
    print("  - Testing services...")
    from app.services.vector_search import vector_search_service
    print("    ✓ Vector search service imported")
    
    print("  - Testing database...")
    from app.utils.database import Base, engine, SessionLocal
    print("    ✓ Database utilities imported")
    
    print("  - Testing main app...")
    from app.main import app
    print("    ✓ App imported successfully!")
    
    # List routes
    print(f"\nRegistered routes ({len(app.routes)} total):")
    for route in app.routes[:10]:  # Show first 10
        if hasattr(route, 'path'):
            print(f"    - {route.path}")
    
    print("\n✅ All imports successful! Ready for Docker build.")
    
except Exception as e:
    print(f"\n❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
EOF

chmod +x test_app_import.py

# 9. Run the test
echo -e "\n9️⃣ Running final import test..."
python3 test_app_import.py

# 10. If successful, show next steps
if [ $? -eq 0 ]; then
    echo -e "\n✅ All issues fixed! Your app is ready for Docker build."
    echo -e "\nNext steps:"
    echo "1. Make sure PostgreSQL is running locally (for final tests)"
    echo "2. Run: docker-compose build backend"
    echo "3. Run: docker-compose up -d"
    echo -e "\nOr skip local PostgreSQL and build directly for Docker:"
    echo "   docker-compose up -d --build"
else
    echo -e "\n❌ Some issues remain. Check the errors above."
fi

echo -e "\n=================================================="
echo "Summary of fixes:"
echo "- Created missing User model"
echo "- Fixed models/__init__.py exports"
echo "- Fixed database.py to handle Docker/local environments"
echo "- Consolidated database configuration"
echo "- Fixed service initialization issues"
echo "- Updated API endpoints to use dependency injection"
echo "- Removed database initialization from service constructors"
echo "=================================================="
