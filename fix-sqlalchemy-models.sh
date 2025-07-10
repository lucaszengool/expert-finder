#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🔧 Fixing SQLAlchemy models issue..."

# Create proper SQLAlchemy models separate from Pydantic models
cat > app/models/db_models.py << 'EOF'
"""SQLAlchemy database models"""
from sqlalchemy import Column, String, Text, JSON, DateTime, Integer, Float, Boolean
from sqlalchemy.sql import func
from app.models.database import Base
import uuid

class ExpertDB(Base):
    """SQLAlchemy model for experts"""
    __tablename__ = "experts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    title = Column(String)
    email = Column(String)
    location = Column(String)
    organization = Column(String)
    bio = Column(Text)
    skills = Column(JSON)
    experience = Column(JSON)
    links = Column(JSON)
    source = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MarketplaceListingDB(Base):
    """SQLAlchemy model for marketplace listings"""
    __tablename__ = "marketplace_listings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    expert_id = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    price_range = Column(String)
    availability = Column(String)
    tags = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
EOF

# Update expert_service.py to use SQLAlchemy models
cat > fix_expert_service.py << 'EOF'
#!/usr/bin/env python3
import re

with open('app/services/expert_service.py', 'r') as f:
    content = f.read()

# Add import for DB models
if 'from app.models.db_models import' not in content:
    # Add after other imports
    import_section = re.search(r'(from app\.models.*?\n)', content)
    if import_section:
        content = content.replace(
            import_section.group(0),
            import_section.group(0) + 'from app.models.db_models import ExpertDB\n'
        )
    else:
        content = 'from app.models.db_models import ExpertDB\n' + content

# Replace db.query(Expert) with db.query(ExpertDB)
content = content.replace('db.query(Expert)', 'db.query(ExpertDB)')

# Update the methods to convert between DB and Pydantic models
# Fix get_experts method
content = re.sub(
    r'def get_experts\(self,[^}]+?\n        return db\.query\(ExpertDB\)\.offset\(skip\)\.limit\(limit\)\.all\(\)',
    '''def get_experts(self, skip: int = 0, limit: int = 100, db=None):
        if db:
            db_experts = db.query(ExpertDB).offset(skip).limit(limit).all()
            return [Expert(**{
                'id': e.id,
                'name': e.name,
                'title': e.title or '',
                'email': e.email or '',
                'location': e.location or '',
                'organization': e.organization or '',
                'bio': e.bio or '',
                'skills': e.skills or [],
                'experience': e.experience or [],
                'links': e.links or {},
                'source': e.source or 'unknown'
            }) for e in db_experts]
        return []''',
    content,
    flags=re.DOTALL
)

# Fix create_expert method
content = re.sub(
    r'def create_expert\(self,[^}]+?\n        db\.refresh\(db_expert\)\n        return db_expert',
    '''def create_expert(self, expert: Expert, db=None):
        if db:
            db_expert = ExpertDB(
                name=expert.name,
                title=expert.title,
                email=expert.email,
                location=expert.location,
                organization=expert.organization,
                bio=expert.bio,
                skills=expert.skills,
                experience=expert.experience,
                links=expert.links,
                source=expert.source
            )
            db.add(db_expert)
            db.commit()
            db.refresh(db_expert)
            return Expert(**{
                'id': db_expert.id,
                'name': db_expert.name,
                'title': db_expert.title or '',
                'email': db_expert.email or '',
                'location': db_expert.location or '',
                'organization': db_expert.organization or '',
                'bio': db_expert.bio or '',
                'skills': db_expert.skills or [],
                'experience': db_expert.experience or [],
                'links': db_expert.links or {},
                'source': db_expert.source or 'unknown'
            })
        return expert''',
    content,
    flags=re.DOTALL
)

with open('app/services/expert_service.py', 'w') as f:
    f.write(content)

print("✅ Updated expert_service.py")
EOF

python3 fix_expert_service.py

# Update the database initialization to use new models
cat > update_db_init.py << 'EOF'
#!/usr/bin/env python3

# Update database.py to import new models
with open('app/models/database.py', 'r') as f:
    content = f.read()

if 'db_models' not in content:
    content = content.replace(
        'def init_db():',
        '''def init_db():
    # Import models to ensure they're registered
    from app.models import db_models'''
    )
    
    with open('app/models/database.py', 'w') as f:
        f.write(content)

print("✅ Updated database initialization")

# Update imports in __init__.py files
with open('app/models/__init__.py', 'a') as f:
    f.write('\nfrom app.models.db_models import ExpertDB, MarketplaceListingDB\n')

print("✅ Updated model imports")
EOF

python3 update_db_init.py

echo -e "\n🏗️ Rebuilding backend with fixes..."
cd ..
docker-compose build backend

echo -e "\n🚀 Restarting backend..."
docker-compose restart backend

# Wait for startup
sleep 5

echo -e "\n📊 Checking logs..."
docker-compose logs --tail=30 backend

echo -e "\n🧪 Testing the API..."
# Test health endpoint
curl -s http://localhost:8000/api/test/health | python3 -m json.tool

# Test experts list endpoint
echo -e "\n📋 Testing GET /api/experts/:"
curl -s http://localhost:8000/api/experts/ | python3 -m json.tool

echo -e "\n✅ SQLAlchemy models issue should be fixed!"
