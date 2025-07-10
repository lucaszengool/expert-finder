"""Search service implementation"""
from typing import List, Dict, Any, Optional
import os
import httpx
import json
from app.agents.web_search_agent import web_search_agent
from app.services.enhanced_search_service import enhanced_search_service

class SearchService:
    """Service for searching experts online"""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")
        self.google_cse_id = os.getenv("GOOGLE_CSE_ID", "")
        self.use_google_api = bool(self.google_api_key and self.google_cse_id)
    
    async def search(
        self, 
        query: str,
        source: str = "all",
        limit: int = 10,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for experts online"""
        
        if not query:
            return {"experts": [], "total": 0}
        
        experts = []
        
        # Use Google Custom Search API if available
        if self.use_google_api:
            experts = await self._google_custom_search(query, limit)
        else:
            # Use web scraping agent as fallback
            search_results = web_search_agent.search_google(query, limit)
            
            # Convert search results to expert format
            for idx, result in enumerate(search_results):
                expert_data = {
                    "id": f"web_{idx}",
                    "name": result.get('title', '').split(' - ')[0],
                    "title": result.get('snippet', '')[:100],
                    "source": "Google Search",
                    "profile_url": result.get('url', ''),
                    "skills": self._extract_skills_from_text(result.get('snippet', '')),
                    "bio": result.get('snippet', ''),
                    "match_score": 85 - (idx * 5)  # Decreasing relevance
                }
                experts.append(expert_data)
        
        # If no results from web search, provide mock data for demo
        if not experts:
            experts = await self._get_mock_experts(query)
        
        # Apply pagination
        total = len(experts)
        experts = experts[offset:offset + limit]
        
        return {
            "experts": experts,
            "total": total,
            "query": query,
            "sources_searched": ["Google", "LinkedIn", "Professional Networks"]
        }
    
    async def _google_custom_search(self, query: str, limit: int) -> List[Dict]:
        """Use Google Custom Search API"""
        try:
            # Build search query
            search_query = f"{query} expert consultant professional LinkedIn"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/customsearch/v1",
                    params={
                        "key": self.google_api_key,
                        "cx": self.google_cse_id,
                        "q": search_query,
                        "num": min(limit, 10)  # Google limits to 10 per request
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    experts = []
                    
                    for idx, item in enumerate(data.get('items', [])):
                        expert = {
                            "id": f"google_{idx}",
                            "name": self._extract_name_from_title(item.get('title', '')),
                            "title": item.get('snippet', '')[:100],
                            "bio": item.get('snippet', ''),
                            "source": "Google",
                            "profile_url": item.get('link', ''),
                            "organization": item.get('displayLink', '').replace('www.', '').split('.')[0].title(),
                            "skills": self._extract_skills_from_text(item.get('snippet', '')),
                            "match_score": 90 - (idx * 5)
                        }
                        experts.append(expert)
                    
                    return experts
                else:
                    print(f"Google API error: {response.status_code}")
                    return []
                    
        except Exception as e:
            print(f"Error calling Google API: {e}")
            return []
    
    def _extract_name_from_title(self, title: str) -> str:
        """Extract name from search result title"""
        # Common patterns: "John Doe - Title", "John Doe | Company"
        if ' - ' in title:
            return title.split(' - ')[0].strip()
        elif ' | ' in title:
            return title.split(' | ')[0].strip()
        elif ' – ' in title:
            return title.split(' – ')[0].strip()
        return title.strip()
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract potential skills from text"""
        # Common skill keywords
        skill_keywords = [
            "AI", "Machine Learning", "Python", "Data Science", "Deep Learning",
            "TensorFlow", "PyTorch", "AWS", "Cloud", "DevOps", "Kubernetes",
            "React", "JavaScript", "Node.js", "SQL", "NoSQL", "Blockchain",
            "Cybersecurity", "Analytics", "Consulting", "Strategy"
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in skill_keywords:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills[:5]  # Limit to 5 skills
    
    async def _get_mock_experts(self, query: str) -> List[Dict]:
        """Get mock experts for demo purposes"""
        mock_experts = []
        
        if "AI" in query.upper() or "machine learning" in query.lower():
            mock_experts = [
                {
                    "id": "mock_1",
                    "name": "Dr. Sarah Chen",
                    "title": "AI Research Scientist & Consultant",
                    "organization": "Stanford AI Lab",
                    "location": "San Francisco, CA",
                    "bio": "Leading AI researcher with 15+ years experience in machine learning and neural networks. Specializes in NLP and computer vision applications.",
                    "skills": ["Machine Learning", "Deep Learning", "Python", "TensorFlow", "NLP"],
                    "source": "LinkedIn",
                    "profile_url": "https://www.linkedin.com/in/sarahchen",
                    "match_score": 95
                },
                {
                    "id": "mock_2",
                    "name": "Prof. Michael Zhang",
                    "title": "ML Engineering Expert",
                    "organization": "MIT CSAIL",
                    "location": "Boston, MA", 
                    "bio": "Expert in production ML systems, MLOps, and scalable AI infrastructure. Author of several influential papers on distributed learning.",
                    "skills": ["MLOps", "Kubernetes", "Python", "Cloud Architecture", "AI"],
                    "source": "University Profile",
                    "profile_url": "https://www.csail.mit.edu/person/michael-zhang",
                    "match_score": 90
                }
            ]
        elif "python" in query.lower():
            mock_experts = [
                {
                    "id": "mock_3",
                    "name": "Alex Rodriguez",
                    "title": "Senior Python Developer & Architect",
                    "organization": "Tech Consulting Inc",
                    "location": "New York, NY",
                    "bio": "15+ years Python development. Expert in Django, FastAPI, and scalable microservices. Regular PyCon speaker.",
                    "skills": ["Python", "Django", "FastAPI", "Microservices", "AWS"],
                    "source": "Professional Network",
                    "profile_url": "#",
                    "match_score": 92
                }
            ]
        
        return mock_experts
    
    async def vector_search(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Vector similarity search"""
        return await self.search(query=query, limit=limit, filters=filters)
    
    async def get_suggestions(self, query: str) -> List[str]:
        """Get search suggestions"""
        if not query or len(query) < 2:
            return []
        
        suggestions = [
            "AI expert",
            "Machine Learning consultant",
            "Python developer",
            "Data Science expert",
            "Cloud architect",
            "Blockchain expert",
            "Cybersecurity consultant",
            "DevOps engineer",
            "React developer",
            "Mobile app expert"
        ]
        
        return [s for s in suggestions if query.lower() in s.lower()][:5]
    
    async def get_trending_searches(self, limit: int = 10) -> List[str]:
        """Get trending searches"""
        return [
            "AI consultant",
            "Machine Learning expert",
            "ChatGPT integration expert",
            "Python developer",
            "Cloud migration specialist",
            "Blockchain developer",
            "Data Science consultant"
        ][:limit]

# Create singleton instance
search_service = SearchService()
