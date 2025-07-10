#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🔧 Fixing final import issues..."
echo "=================================================="

# 1. Check what search.py is trying to import
echo -e "\n1️⃣ Checking search API imports..."
grep "from app.models.search import" app/api/search.py

# 2. Fix the search API to use schemas instead of models
echo -e "\n2️⃣ Fixing search API imports..."
cat > app/api/search.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from app.models.schemas import SearchQuery, SearchResponse
from app.services.search_service import search_service
from app.utils.database import get_db

router = APIRouter(prefix="/api/search", tags=["search"])

@router.post("/", response_model=SearchResponse)
async def search_experts(
    query: SearchQuery,
    db: Session = Depends(get_db)
):
    """Search for experts based on query"""
    try:
        results = await search_service.search(
            query=query.query,
            filters=query.filters,
            limit=query.limit,
            offset=query.offset,
            db=db
        )
        return SearchResponse(
            results=results,
            total=len(results),
            query=query.query,
            filters=query.filters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions")
async def get_search_suggestions(
    q: str,
    limit: int = 5
):
    """Get search suggestions based on partial query"""
    try:
        suggestions = await search_service.get_suggestions(q, limit)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
EOF
echo "✓ Fixed search.py"

# 3. Create search_service.py if it doesn't exist
echo -e "\n3️⃣ Creating search service..."
if [ ! -f "app/services/search_service.py" ]; then
    cat > app/services/search_service.py << 'EOF'
"""Search service for expert finding"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.expert import Expert
from app.models.search import SearchHistory
import json

class SearchService:
    async def search(
        self,
        query: str,
        filters: Dict[str, Any] = {},
        limit: int = 10,
        offset: int = 0,
        db: Optional[Session] = None
    ) -> List[Dict[str, Any]]:
        """Search for experts"""
        # For now, return a simple implementation
        # In production, this would use vector search, elasticsearch, etc.
        
        results = []
        
        if db:
            # Simple database search
            experts_query = db.query(Expert)
            
            # Apply text search on name, title, bio
            if query:
                experts_query = experts_query.filter(
                    Expert.name.ilike(f"%{query}%") |
                    Expert.title.ilike(f"%{query}%") |
                    Expert.bio.ilike(f"%{query}%")
                )
            
            # Apply filters
            if filters.get("location"):
                experts_query = experts_query.filter(
                    Expert.location.ilike(f"%{filters['location']}%")
                )
            
            if filters.get("min_rate"):
                experts_query = experts_query.filter(
                    Expert.hourly_rate >= filters["min_rate"]
                )
            
            if filters.get("max_rate"):
                experts_query = experts_query.filter(
                    Expert.hourly_rate <= filters["max_rate"]
                )
            
            # Apply pagination
            experts = experts_query.offset(offset).limit(limit).all()
            
            # Convert to dict
            for expert in experts:
                results.append({
                    "id": expert.id,
                    "name": expert.name,
                    "title": expert.title,
                    "company": expert.company,
                    "location": expert.location,
                    "bio": expert.bio,
                    "hourly_rate": expert.hourly_rate,
                    "rating": expert.rating,
                    "skills": expert.skills or [],
                    "expertise": expert.expertise or []
                })
            
            # Log search
            if query:
                search_log = SearchHistory(
                    query=query,
                    filters=filters,
                    results_count=len(results)
                )
                db.add(search_log)
                db.commit()
        
        return results
    
    async def get_suggestions(self, partial_query: str, limit: int = 5) -> List[str]:
        """Get search suggestions"""
        # Simple implementation - in production would use elasticsearch or similar
        suggestions = [
            f"{partial_query} expert",
            f"{partial_query} consultant",
            f"{partial_query} specialist",
            f"{partial_query} developer",
            f"{partial_query} engineer"
        ]
        return suggestions[:limit]

# Global instance
search_service = SearchService()
EOF
    echo "✓ Created search_service.py"
fi

# 4. Fix marketplace API imports
echo -e "\n4️⃣ Fixing marketplace API..."
cat > app/api/marketplace.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from app.models.schemas import MarketplaceListingCreate, MarketplaceListingResponse
from app.services.marketplace_service import MarketplaceService
from app.utils.database import get_db

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

def get_marketplace_service():
    return MarketplaceService()

@router.post("/listings", response_model=MarketplaceListingResponse)
async def create_listing(
    listing: MarketplaceListingCreate,
    db: Session = Depends(get_db),
    service: MarketplaceService = Depends(get_marketplace_service)
):
    """Create a new marketplace listing"""
    try:
        return service.create_listing(listing.dict(), db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/listings", response_model=List[MarketplaceListingResponse])
async def get_listings(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db),
    service: MarketplaceService = Depends(get_marketplace_service)
):
    """Get marketplace listings"""
    return service.get_listings(skip=skip, limit=limit, category=category, db=db)

@router.get("/listings/{listing_id}", response_model=MarketplaceListingResponse)
async def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    service: MarketplaceService = Depends(get_marketplace_service)
):
    """Get a specific listing"""
    listing = service.get_listing(listing_id, db)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
EOF
echo "✓ Fixed marketplace.py"

# 5. Create marketplace service if needed
echo -e "\n5️⃣ Creating marketplace service..."
if [ ! -f "app/services/marketplace_service.py" ]; then
    cat > app/services/marketplace_service.py << 'EOF'
"""Marketplace service"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.marketplace import MarketplaceListing

class MarketplaceService:
    def create_listing(self, listing_data: dict, db: Session) -> MarketplaceListing:
        """Create a new marketplace listing"""
        listing = MarketplaceListing(**listing_data)
        db.add(listing)
        db.commit()
        db.refresh(listing)
        return listing
    
    def get_listings(
        self,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        db: Optional[Session] = None
    ) -> List[MarketplaceListing]:
        """Get marketplace listings"""
        if not db:
            return []
        
        query = db.query(MarketplaceListing).filter(MarketplaceListing.is_active == True)
        
        if category:
            query = query.filter(MarketplaceListing.category == category)
        
        return query.offset(skip).limit(limit).all()
    
    def get_listing(self, listing_id: int, db: Session) -> Optional[MarketplaceListing]:
        """Get a specific listing"""
        return db.query(MarketplaceListing).filter(
            MarketplaceListing.id == listing_id,
            MarketplaceListing.is_active == True
        ).first()
EOF
    echo "✓ Created marketplace_service.py"
fi

# 6. Create a final test script
echo -e "\n6️⃣ Creating final test..."
cat > test_final.py << 'EOF'
#!/usr/bin/env python3
import os
import sys

# Setup environment
os.environ['TESTING'] = 'true'
os.environ['ANONYMIZED_TELEMETRY'] = 'false'
os.environ['DATABASE_URL'] = 'postgresql://expertuser:expertpass@localhost:5432/expertdb'

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing final setup...")
    
    # Test imports step by step
    print("1. Testing models...")
    from app.models import Expert, User, MarketplaceListing, SearchHistory, ExpertDNA
    print("   ✓ Models OK")
    
    print("2. Testing schemas...")
    from app.models.schemas import SearchQuery, SearchResponse, ExpertCreate
    print("   ✓ Schemas OK")
    
    print("3. Testing services...")
    from app.services.vector_search import vector_search_service
    from app.services.search_service import search_service
    print("   ✓ Services OK")
    
    print("4. Testing database...")
    from app.utils.database import Base, engine, SessionLocal
    print("   ✓ Database OK")
    
    print("5. Testing APIs...")
    from app.api import experts, search, marketplace, matching
    print("   ✓ APIs OK")
    
    print("6. Testing main app...")
    from app.main import app
    print("   ✓ App imported successfully!")
    
    # Show some stats
    print(f"\nApp ready with {len(app.routes)} routes")
    print("\n✅ All tests passed! Ready for Docker build.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
EOF

chmod +x test_final.py

# 7. Run the final test
echo -e "\n7️⃣ Running final test..."
python3 test_final.py

if [ $? -eq 0 ]; then
    echo -e "\n✅ All issues fixed! Building Docker..."
    
    # Build and run Docker
    cd /Users/James/Desktop/expert-finder
    docker-compose down
    docker-compose up -d --build
    
    # Wait for startup
    echo "⏳ Waiting for services to start (30 seconds)..."
    sleep 30
    
    # Check health
    echo -e "\n🏥 Checking service health..."
    curl -s http://localhost:8000/health | python3 -m json.tool || echo "Health check pending..."
    
    # Show logs
    echo -e "\n📋 Recent logs:"
    docker-compose logs --tail=30 backend
    
    echo -e "\n✅ SETUP COMPLETE!"
    echo -e "\nYour Expert Finder backend is running at:"
    echo "- API: http://localhost:8000"
    echo "- Docs: http://localhost:8000/docs"
    echo "- ReDoc: http://localhost:8000/redoc"
else
    echo -e "\n❌ Tests still failing. Check the errors above."
fi

# Cleanup
rm -f test_final.py

echo -e "\n=================================================="
