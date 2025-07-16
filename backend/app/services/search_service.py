"""Search service implementation"""
from typing import List, Dict, Any, Optional
import os
import httpx
import json
from app.agents.web_search_agent import web_search_agent
from app.services.enhanced_search_service import enhanced_search_service

from typing import List, Dict, Any, Optional
import os
import httpx
import json
import re
from app.agents.web_search_agent import web_search_agent
from app.services.enhanced_search_service import enhanced_search_service
from app.services.linkedin_profile_extractor import linkedin_profile_extractor

from typing import List, Dict, Any, Optional
import os
import httpx
import json
import re
from app.agents.web_search_agent import web_search_agent
from app.services.enhanced_search_service import enhanced_search_service
from app.services.linkedin_profile_extractor import linkedin_profile_extractor

class SearchService:
    """Service for searching experts online with proper filtering"""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")
        self.google_cse_id = os.getenv("GOOGLE_CSE_ID", "")
        self.use_google_api = bool(self.google_api_key and self.google_cse_id)
        
        # Article/Ad patterns to filter out
        self.article_patterns = [
            r'/article/', r'/blog/', r'/news/', r'/post/', r'/stories/',
            r'medium\.com', r'forbes\.com', r'techcrunch\.com', r'venturebeat\.com',
            r'businessinsider\.com', r'huffpost\.com', r'buzzfeed\.com',
            r'/amp/', r'\.amp', r'/sponsored/', r'/advertisement/',
            r'reddit\.com/r/', r'quora\.com/q/', r'stackoverflow\.com/questions/'
        ]
        
        # Expert profile patterns to prioritize
        self.expert_patterns = [
            r'linkedin\.com/in/', r'github\.com/', r'twitter\.com/',
            r'researchgate\.net/profile/', r'scholar\.google\.com/citations',
            r'orcid\.org/', r'academia\.edu/', r'about\.me/',
            r'personal\.', r'portfolio\.', r'\.bio', r'/cv', r'/resume',
            r'faculty\.', r'staff\.', r'/people/', r'/team/', r'/profile/'
        ]
    
    def _is_article_or_ad(self, url: str, title: str, snippet: str) -> bool:
        """Check if a result is an article or ad instead of an expert profile"""
        url_lower = url.lower()
        title_lower = title.lower()
        snippet_lower = snippet.lower()
        
        # Check URL patterns
        for pattern in self.article_patterns:
            if re.search(pattern, url_lower):
                return True
        
        # Check title patterns that indicate articles
        article_title_keywords = [
            'how to', 'guide to', 'tips for', 'best practices',
            'top 10', 'top 5', 'why you should', 'what is',
            'ultimate guide', 'complete guide', 'everything you need'
        ]
        for keyword in article_title_keywords:
            if keyword in title_lower:
                return True
        
        # Check if it's a list/compilation article
        if re.search(r'\d+\s+(best|top|great|amazing)', title_lower):
            return True
        
        # Check snippet for article-like content
        article_snippet_patterns = [
            'in this article', 'this post', 'read more',
            'continue reading', 'click here', 'subscribe',
            'sponsored by', 'advertisement', 'promoted'
        ]
        for pattern in article_snippet_patterns:
            if pattern in snippet_lower:
                return True
        
        return False
    
    def _is_expert_profile(self, url: str, title: str, snippet: str) -> bool:
        """Check if a result is likely an expert profile"""
        url_lower = url.lower()
        
        # Check for expert profile patterns
        for pattern in self.expert_patterns:
            if re.search(pattern, url_lower):
                return True
        
        # Check if title contains person's name pattern
        # Simple heuristic: starts with capitalized words (likely a name)
        if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+', title):
            # Check if it has professional indicators
            prof_indicators = ['phd', 'dr.', 'prof', 'engineer', 'scientist',
                             'researcher', 'developer', 'analyst', 'consultant',
                             'expert', 'specialist', 'architect', 'manager']
            for indicator in prof_indicators:
                if indicator in title.lower() or indicator in snippet.lower():
                    return True
        
        return False
    
    def _extract_expert_from_result(self, result: Dict, source: str = "web") -> Optional[Dict]:
        """Extract expert information from a search result"""
        url = result.get('link', result.get('url', ''))
        title = result.get('title', '')
        snippet = result.get('snippet', '')
        
        # Skip if it's an article or ad
        if self._is_article_or_ad(url, title, snippet):
            return None
        
        # Prioritize if it's an expert profile
        is_profile = self._is_expert_profile(url, title, snippet)
        
        # Extract name from title
        name = self._extract_name_from_title(title)
        if not name and not is_profile:
            return None
        
        # Determine profile type
        profile_type = "unknown"
        if 'linkedin.com/in/' in url:
            profile_type = "linkedin"
        elif 'github.com/' in url:
            profile_type = "github"
        elif 'twitter.com/' in url:
            profile_type = "twitter"
        elif 'researchgate.net' in url:
            profile_type = "researchgate"
        elif 'scholar.google.com' in url:
            profile_type = "google_scholar"
        elif is_profile:
            profile_type = "professional"
        
        # Extract skills from snippet
        skills = self._extract_skills_from_text(snippet)
        
        # Calculate relevance score
        base_score = 70
        if profile_type != "unknown":
            base_score += 20
        if skills:
            base_score += 5
        if is_profile:
            base_score += 5
        
        expert_data = {
            "name": name or title.split(' - ')[0].strip(),
            "title": self._extract_title_from_snippet(snippet),
            "source": source,
            "url": url,
            "profile_type": profile_type,
            "skills": skills,
            "bio": snippet,
            "match_score": min(base_score, 100),
            "is_verified_profile": profile_type != "unknown"
        }
        
        return expert_data
    
    def _extract_name_from_title(self, title: str) -> Optional[str]:
        """Extract person's name from title"""
        # Remove common suffixes
        title = re.sub(r'\s*[-–|]\s*LinkedIn.*$', '', title)
        title = re.sub(r'\s*[-–|]\s*GitHub.*$', '', title)
        title = re.sub(r'\s*[-–|]\s*Twitter.*$', '', title)
        
        # Check if it looks like a name (2-4 capitalized words)
        name_match = re.match(r'^([A-Z][a-z]+\s+){1,3}[A-Z][a-z]+', title)
        if name_match:
            return name_match.group(0).strip()
        
        return None
    
    def _extract_title_from_snippet(self, snippet: str) -> str:
        """Extract professional title from snippet"""
        # Look for common title patterns
        patterns = [
            r'(?:is\s+a|is\s+an|works\s+as|working\s+as)\s+([^.]+)',
            r'^([A-Z][^.]+(?:Engineer|Developer|Scientist|Researcher|Manager|Director|Consultant|Analyst|Architect))',
            r'([A-Z][^.]+\s+at\s+[A-Z][^.]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, snippet)
            if match:
                return match.group(1).strip()[:100]
        
        # Fallback to first sentence
        first_sentence = snippet.split('.')[0]
        return first_sentence[:100] if first_sentence else "Expert"
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from text"""
        skills = []
        
        # Common tech skills to look for
        skill_keywords = [
            'python', 'java', 'javascript', 'react', 'node.js', 'aws', 'docker',
            'kubernetes', 'machine learning', 'deep learning', 'ai', 'data science',
            'blockchain', 'cloud', 'devops', 'agile', 'sql', 'nosql', 'mongodb',
            'postgresql', 'redis', 'elasticsearch', 'tensorflow', 'pytorch',
            'nlp', 'computer vision', 'robotics', 'iot', 'cybersecurity',
            'web3', 'solidity', 'rust', 'go', 'scala', 'spark', 'hadoop'
        ]
        
        text_lower = text.lower()
        for skill in skill_keywords:
            if skill in text_lower:
                skills.append(skill)
        
        return list(set(skills))[:10]  # Return up to 10 unique skills
    
    async def search(
        self, 
        query: str,
        source: str = "all",
        limit: int = 10,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for experts online with improved filtering"""
        
        if not query:
            return {"experts": [], "total": 0}
        
        # Add expert-specific keywords to query if not present
        query_lower = query.lower()
        if not any(word in query_lower for word in ['expert', 'consultant', 'engineer', 'developer', 'scientist']):
            # Add context to find people, not articles
            enhanced_query = f"{query} expert OR consultant OR professional LinkedIn GitHub"
        else:
            enhanced_query = query
        
        experts = []
        
        # Use Google Custom Search API if available
        if self.use_google_api:
            experts = await self._google_custom_search(enhanced_query, limit * 3)  # Get more results to filter
        else:
            # Use web scraping agent as fallback
            search_results = web_search_agent.search_google(enhanced_query, limit * 3)
            
            # Convert search results to expert format
            for result in search_results:
                expert_data = self._extract_expert_from_result(result, "Google Search")
                if expert_data:
                    experts.append(expert_data)
        
        # Filter out non-expert results
        filtered_experts = []
        for expert in experts:
            if expert.get('is_verified_profile') or expert.get('profile_type') != 'unknown':
                filtered_experts.append(expert)
        
        # If we don't have enough verified profiles, include high-quality unverified ones
        if len(filtered_experts) < limit:
            for expert in experts:
                if expert not in filtered_experts and expert.get('match_score', 0) >= 80:
                    filtered_experts.append(expert)
                if len(filtered_experts) >= limit:
                    break
        
        # Sort by relevance and profile quality
        filtered_experts.sort(key=lambda x: (
            x.get('is_verified_profile', False),
            x.get('match_score', 0)
        ), reverse=True)
        
        # Apply pagination
        paginated_experts = filtered_experts[offset:offset + limit]
        
        # Add IDs
        for idx, expert in enumerate(paginated_experts):
            expert['id'] = f"expert_{offset + idx}"
        
        return {
            "experts": paginated_experts,
            "total": len(filtered_experts),
            "filtered_count": len(experts) - len(filtered_experts),  # How many were filtered out
            "query": query,
            "enhanced_query": enhanced_query
        }
    
    async def _google_custom_search(self, query: str, num_results: int) -> List[Dict]:
        """Use Google Custom Search API with expert-focused parameters"""
        experts = []
        
        # Google CSE URL
        url = "https://www.googleapis.com/customsearch/v1"
        
        # Add site restrictions for professional profiles
        site_restrict = " OR ".join([
            "site:linkedin.com/in",
            "site:github.com",
            "site:researchgate.net",
            "site:scholar.google.com",
            "site:orcid.org"
        ])
        
        params = {
            "key": self.google_api_key,
            "cx": self.google_cse_id,
            "q": f"{query} ({site_restrict})",
            "num": min(num_results, 10),  # Google CSE limit
            "start": 1
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params)
                data = response.json()
                
                if "items" in data:
                    for item in data["items"]:
                        expert_data = self._extract_expert_from_result(item, "Google CSE")
                        if expert_data:
                            experts.append(expert_data)
                
            except Exception as e:
                print(f"Error in Google Custom Search: {e}")
        
        return experts
    
    async def vector_search(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Vector similarity search for experts"""
        # This is a placeholder - implement with your vector DB
        return await self.search(query, "vector", limit, 0, filters)
    
    async def get_suggestions(self, partial_query: str) -> List[str]:
        """Get search suggestions"""
        # Add expert-focused suggestions
        base_suggestions = [
            f"{partial_query} expert",
            f"{partial_query} consultant",
            f"{partial_query} engineer",
            f"{partial_query} developer",
            f"{partial_query} specialist"
        ]
        return base_suggestions[:5]
    
    async def get_trending_searches(self, limit: int) -> List[str]:
        """Get trending searches"""
        # Placeholder - implement with your analytics
        return [
            "machine learning engineer",
            "blockchain developer",
            "data scientist",
            "cloud architect",
            "AI consultant"
        ][:limit]

# Create singleton instance
search_service = SearchService()
