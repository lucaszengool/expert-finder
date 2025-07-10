#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🔧 Fixing model class names..."
echo "=================================================="

# 1. Check what's actually in each model file
echo -e "\n1️⃣ Checking current model classes..."

echo -e "\nChecking marketplace.py:"
grep "^class" app/models/marketplace.py || echo "No classes found!"

echo -e "\nChecking search.py:"
grep "^class" app/models/search.py || echo "No classes found!"

echo -e "\nChecking expert.py:"
grep "^class" app/models/expert.py || echo "No classes found!"

echo -e "\nChecking expert_dna.py:"
grep "^class" app/models/expert_dna.py || echo "No classes found!"

# 2. Fix marketplace.py - ensure it has MarketplaceListing class
echo -e "\n2️⃣ Fixing marketplace.py..."
cat > app/models/marketplace.py << 'EOF'
"""Marketplace listing model"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"
    
    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, index=True)
    price = Column(Float)
    currency = Column(String, default="USD")
    duration = Column(String)  # e.g., "1 hour", "30 minutes"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    expert = relationship("Expert", back_populates="listings")
EOF
echo "✓ Fixed marketplace.py"

# 3. Fix search.py - ensure it has SearchHistory class
echo -e "\n3️⃣ Fixing search.py..."
cat > app/models/search.py << 'EOF'
"""Search history model"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.utils.database import Base

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # Optional, for logged-in users
    query = Column(String, nullable=False)
    filters = Column(JSON)  # Store search filters as JSON
    results_count = Column(Integer)
    session_id = Column(String)  # For anonymous users
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
EOF
echo "✓ Fixed search.py"

# 4. Fix expert.py - ensure it has Expert class
echo -e "\n4️⃣ Checking/fixing expert.py..."
if ! grep -q "class Expert" app/models/expert.py; then
    cat > app/models/expert.py << 'EOF'
"""Expert model"""
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base

class Expert(Base):
    __tablename__ = "experts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, index=True)
    title = Column(String)
    company = Column(String)
    location = Column(String)
    bio = Column(Text)
    expertise = Column(JSON)  # List of expertise areas
    skills = Column(JSON)  # List of skills
    rating = Column(Float, default=0.0)
    hourly_rate = Column(Float)
    currency = Column(String, default="USD")
    linkedin_url = Column(String)
    website_url = Column(String)
    profile_image_url = Column(String)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    listings = relationship("MarketplaceListing", back_populates="expert")
    dna = relationship("ExpertDNA", back_populates="expert", uselist=False)
EOF
    echo "✓ Created expert.py"
else
    echo "✓ expert.py already has Expert class"
fi

# 5. Fix expert_dna.py - ensure it has ExpertDNA class
echo -e "\n5️⃣ Checking/fixing expert_dna.py..."
if ! grep -q "class ExpertDNA" app/models/expert_dna.py; then
    cat > app/models/expert_dna.py << 'EOF'
"""Expert DNA model for advanced matching"""
from sqlalchemy import Column, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.database import Base

class ExpertDNA(Base):
    __tablename__ = "expert_dna"
    
    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), unique=True, nullable=False)
    
    # Skill vectors and embeddings
    skill_embeddings = Column(JSON)  # Vector embeddings of skills
    expertise_graph = Column(JSON)  # Knowledge graph representation
    
    # Behavioral and performance metrics
    response_time_avg = Column(Integer)  # Average response time in minutes
    completion_rate = Column(Integer)  # Percentage of completed projects
    client_satisfaction = Column(Integer)  # Average satisfaction score
    
    # Communication style
    communication_style = Column(JSON)  # e.g., {"formal": 0.7, "casual": 0.3}
    language_proficiency = Column(JSON)  # e.g., {"english": "native", "spanish": "fluent"}
    
    # Availability patterns
    availability_pattern = Column(JSON)  # Time zone, preferred hours, etc.
    
    # Matching preferences
    project_preferences = Column(JSON)  # Types of projects preferred
    team_preferences = Column(JSON)  # Preferred team sizes, roles, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    expert = relationship("Expert", back_populates="dna")
EOF
    echo "✓ Created expert_dna.py"
else
    echo "✓ expert_dna.py already has ExpertDNA class"
fi

# 6. Create schemas.py if it doesn't exist
echo -e "\n6️⃣ Creating schemas.py..."
if [ ! -f "app/models/schemas.py" ]; then
    cat > app/models/schemas.py << 'EOF'
"""Pydantic schemas for API requests/responses"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Expert schemas
class ExpertBase(BaseModel):
    name: str
    email: EmailStr
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[List[str]] = []
    skills: Optional[List[str]] = []
    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None

class ExpertCreate(ExpertBase):
    pass

class ExpertUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None

class ExpertResponse(ExpertBase):
    id: int
    rating: float
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Marketplace schemas
class MarketplaceListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    duration: Optional[str] = None

class MarketplaceListingCreate(MarketplaceListingBase):
    expert_id: int

class MarketplaceListingResponse(MarketplaceListingBase):
    id: int
    expert_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Search schemas
class SearchQuery(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = {}
    limit: Optional[int] = 10
    offset: Optional[int] = 0

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total: int
    query: str
    filters: Dict[str, Any]
EOF
    echo "✓ Created schemas.py"
else
    echo "✓ schemas.py already exists"
fi

# 7. Update models/__init__.py to ensure proper imports
echo -e "\n7️⃣ Updating models/__init__.py..."
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

# 8. Test imports again
echo -e "\n8️⃣ Testing imports..."
python3 test_app_import.py

if [ $? -eq 0 ]; then
    echo -e "\n✅ All model issues fixed!"
    echo -e "\nYou can now build Docker:"
    echo "  cd /Users/James/Desktop/expert-finder"
    echo "  docker-compose up -d --build"
else
    echo -e "\n❌ Still having issues. Let's check what's wrong..."
    
    # Debug specific imports
    python3 << 'DEBUGPY'
import sys
import os
sys.path.insert(0, os.getcwd())
os.environ['TESTING'] = 'true'

print("\nDebugging model imports:")
try:
    from app.models.expert import Expert
    print("✓ Expert imported")
except Exception as e:
    print(f"✗ Expert: {e}")

try:
    from app.models.expert_dna import ExpertDNA
    print("✓ ExpertDNA imported")
except Exception as e:
    print(f"✗ ExpertDNA: {e}")

try:
    from app.models.marketplace import MarketplaceListing
    print("✓ MarketplaceListing imported")
except Exception as e:
    print(f"✗ MarketplaceListing: {e}")

try:
    from app.models.search import SearchHistory
    print("✓ SearchHistory imported")
except Exception as e:
    print(f"✗ SearchHistory: {e}")

try:
    from app.models.user import User
    print("✓ User imported")
except Exception as e:
    print(f"✗ User: {e}")
DEBUGPY
fi

echo -e "\n=================================================="
echo "Fixed:"
echo "- Created proper MarketplaceListing class"
echo "- Created proper SearchHistory class"
echo "- Ensured all model classes exist with correct names"
echo "- Created schemas.py for Pydantic models"
echo "- Updated all imports"
echo "=================================================="
