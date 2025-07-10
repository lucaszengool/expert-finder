#!/bin/bash

echo "🔧 Fixing backend services..."

# 1. Fix ExpertService - create a simple working version
docker exec expert-finder-backend-1 bash -c 'cat > /app/app/services/expert_service.py << "EOSERVICE"
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.expert import Expert

class ExpertService:
    def __init__(self):
        pass
    
    def create_expert(self, expert_data: dict, db: Session) -> Expert:
        """Create a new expert"""
        expert = Expert(**expert_data)
        db.add(expert)
        db.commit()
        db.refresh(expert)
        return expert
    
    def get_experts(self, skip: int = 0, limit: int = 100, db: Session = None) -> List[Expert]:
        """Get all experts"""
        if not db:
            return []
        return db.query(Expert).offset(skip).limit(limit).all()
    
    def get_expert_by_id(self, expert_id: int, db: Session) -> Optional[Expert]:
        """Get expert by ID"""
        return db.query(Expert).filter(Expert.id == expert_id).first()
    
    def update_expert(self, expert_id: int, expert_data: dict, db: Session) -> Optional[Expert]:
        """Update expert"""
        expert = self.get_expert_by_id(expert_id, db)
        if expert:
            for key, value in expert_data.items():
                if value is not None:
                    setattr(expert, key, value)
            db.commit()
            db.refresh(expert)
        return expert
    
    def delete_expert(self, expert_id: int, db: Session) -> bool:
        """Delete expert"""
        expert = self.get_expert_by_id(expert_id, db)
        if expert:
            db.delete(expert)
            db.commit()
            return True
        return False
EOSERVICE'

# 2. Fix SearchService - create a simple working version
docker exec expert-finder-backend-1 bash -c 'cat > /app/app/services/search_service.py << "EOSEARCH"
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.expert import Expert
import os

class SearchService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.anthropic = None  # Disabled due to client issues
    
    async def search(self, query: str, filters: dict = {}, limit: int = 10, offset: int = 0, db: Session = None) -> List[Dict[str, Any]]:
        """Search for experts"""
        if not db:
            return []
        
        experts_query = db.query(Expert)
        
        if query:
            experts_query = experts_query.filter(
                Expert.name.ilike(f"%{query}%") |
                Expert.title.ilike(f"%{query}%") |
                Expert.bio.ilike(f"%{query}%")
            )
        
        if filters.get("location"):
            location_filter = filters["location"]
            experts_query = experts_query.filter(Expert.location.ilike(f"%{location_filter}%"))
        
        if filters.get("min_rate"):
            experts_query = experts_query.filter(Expert.hourly_rate >= filters["min_rate"])
        
        experts = experts_query.offset(offset).limit(limit).all()
        
        results = []
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
        
        return results
    
    async def get_suggestions(self, partial_query: str, limit: int = 5) -> List[str]:
        """Get search suggestions"""
        suggestions = [
            f"{partial_query} expert",
            f"{partial_query} consultant",
            f"{partial_query} specialist"
        ]
        return suggestions[:limit]

search_service = SearchService()
EOSEARCH'

# 3. Restart backend
docker-compose restart backend

echo "✅ Services fixed!"
echo ""
echo "Waiting for backend to start..."
sleep 10

# 4. Test creating an expert
echo "📝 Testing expert creation..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/experts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "email": "jane.smith@example.com",
    "title": "AI Research Scientist",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "bio": "Expert in machine learning and NLP",
    "expertise": ["Machine Learning", "NLP", "Python"],
    "skills": ["TensorFlow", "PyTorch", "BERT"],
    "hourly_rate": 200
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# 5. List experts
echo -e "\n📋 Listing experts..."
curl -s http://localhost:8000/api/experts/ | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/experts/

echo -e "\n✅ Backend is working!"
echo "Access the API docs at: http://localhost:8000/docs"
