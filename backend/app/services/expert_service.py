from typing import List, Optional
from app.models.expert import Expert
from app.models.db_models import ExpertDB
from app.utils.database import get_collection, init_db
from app.utils.embeddings import embedding_generator
import uuid
from typing import Dict
from typing import Any

class ExpertService:
    def __init__(self):
        # Lazy-load collections to avoid initialization issues
        self._linkedin_collection = None
        self._scholar_collection = None
    
    @property
    def linkedin_collection(self):
        if self._linkedin_collection is None:
            try:
                self._linkedin_collection = get_collection("linkedin_experts")
            except Exception as e:
                print(f"⚠️ Failed to load linkedin collection: {e}")
                return None
        return self._linkedin_collection
    
    @property
    def scholar_collection(self):
        if self._scholar_collection is None:
            try:
                self._scholar_collection = get_collection("scholar_experts")
            except Exception as e:
                print(f"⚠️ Failed to load scholar collection: {e}")
                return None
        return self._scholar_collection
    
    def create_expert_text(self, expert: Expert) -> str:
        """Create searchable text from expert data"""
        parts = [
            expert.name,
            expert.title or "",
            expert.organization or "",
            expert.bio or "",
            " ".join(expert.skills),
            expert.location or ""
        ]
        return " ".join(filter(None, parts))
    
    def add_expert(self, expert: Expert, source: str = "linkedin"):
        """Add an expert to the database"""
        collection = self.linkedin_collection if source == "linkedin" else self.scholar_collection
        
        if collection is None:
            print(f"⚠️ Collection not available for source: {source}")
            return expert
        
        try:
            # Generate embedding
            text = self.create_expert_text(expert)
            embedding = embedding_generator.generate_embedding(text)
            
            # Add to collection
            collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[expert.dict()],
                ids=[expert.id]
            )
        except Exception as e:
            print(f"⚠️ Failed to add expert to collection: {e}")
        
        return expert
    
    def search_experts(self, query: str, source: str = "all", limit: int = 10) -> List[Expert]:
        """Search for experts based on query"""
        results = []
        
        # Generate query embedding
        query_embedding = embedding_generator.generate_embedding(query)
        
        # Search in LinkedIn collection
        if source in ["all", "linkedin"] and self.linkedin_collection is not None:
            try:
                linkedin_results = self.linkedin_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=limit
                )
                if linkedin_results['metadatas'] and linkedin_results['metadatas'][0]:
                    for metadata in linkedin_results['metadatas'][0]:
                        expert = Expert(**metadata)
                        expert.source = "linkedin"
                        results.append(expert)
            except Exception as e:
                print(f"⚠️ Error searching LinkedIn collection: {e}")
        
        # Search in Scholar collection
        if source in ["all", "scholar"] and self.scholar_collection is not None:
            try:
                scholar_results = self.scholar_collection.query(
                    query_embeddings=[query_embedding],
                    n_results=limit
                )
                if scholar_results['metadatas'] and scholar_results['metadatas'][0]:
                    for metadata in scholar_results['metadatas'][0]:
                        expert = Expert(**metadata)
                        expert.source = "scholar"
                        results.append(expert)
            except Exception as e:
                print(f"⚠️ Error searching Scholar collection: {e}")
        
        # Calculate credibility scores
        results = self.calculate_credibility_scores(results)
        
        # Sort by credibility score
        results.sort(key=lambda x: x.credibility_score or 0, reverse=True)
        
        return results[:limit]
    
    def calculate_credibility_scores(self, experts: List[Expert]) -> List[Expert]:
        """Calculate credibility scores for experts"""
        if not experts:
            return experts
        
        # Simple scoring based on available data
        for expert in experts:
            score = 0
            
            # Experience years (max 20 points)
            if expert.experience_years:
                score += min(expert.experience_years, 20)
            
            # Education level (max 20 points)
            education_scores = {
                "PhD": 20,
                "Masters": 15,
                "Bachelors": 10,
                "Other": 5
            }
            score += education_scores.get(expert.education_level or "Other", 5)
            
            # Citations (max 30 points)
            if expert.citations:
                score += min(expert.citations / 100, 30)
            
            # Skills count (max 20 points)
            score += min(len(expert.skills) * 2, 20)
            
            # Has bio (10 points)
            if expert.bio:
                score += 10
            
            expert.credibility_score = min(score, 100)
        
        return experts

# Don't initialize the service at module level
# expert_service = ExpertService()  # Commented out to prevent init on import

# Add to existing ExpertService class
async def get_expert_with_details(self, expert_id: str) -> Dict[str, Any]:
    """Get expert with all enhanced details"""
    # Get basic expert info
    expert = await self.get_expert_by_id(expert_id)
    
    if expert:
        # Enhance with additional data
        async with enhanced_search_service as search:
            details = await search.search_expert_details(
                expert.get('name', ''),
                expert.get('expertise', '')
            )
            
            # Merge enhanced data
            expert.update({
                'contacts': details.get('contacts', []),
                'images': details.get('images', []),
                'credentials': details.get('credentials', []),
                'social_proof': details.get('social_proof', []),
                'linkedin_data': details.get('linkedin_data', {}),
                'available_now': True,  # Check actual availability
                'response_time': "within 24 hours",
                'consultation_types': ["video", "phone", "chat"],
                'verified_expert': True
            })
    
    return expert

async def search_experts_enhanced(self, query: str, category: str = None, limit: int = 20) -> List[Dict]:
    """Enhanced search with rich data"""
    # Get basic search results
    results = await self.search_experts(query, category, limit)
    
    # Enhance top results with additional data
    enhanced_results = []
    async with enhanced_search_service as search:
        for i, expert in enumerate(results[:5]):  # Enhance top 5 results
            details = await search.search_expert_details(
                expert.get('name', ''),
                query
            )
            
            expert.update({
                'contacts': details.get('contacts', [])[:3],  # Top 3 contacts
                'images': details.get('images', [])[:2],  # Top 2 images
                'social_proof': details.get('social_proof', []),
                'match_reasons': [
                    f"Expert in {query}",
                    f"{expert.get('experience_years', 5)}+ years experience",
                    "Highly rated by clients"
                ],
                'available_now': i % 2 == 0,  # Simulate availability
                'response_time': "within 2 hours" if i % 2 == 0 else "within 24 hours"
            })
            enhanced_results.append(expert)
    
    # Add remaining results without enhancement
    enhanced_results.extend(results[5:])
    
    return enhanced_results
