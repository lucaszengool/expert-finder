#!/usr/bin/env python3
"""
Enhanced Search Service with Real LinkedIn/GitHub Profile Support
File: /backend/app/services/search_service.py
"""

from typing import List, Dict, Any, Optional
import os
import httpx
import json
import re
import asyncio
from datetime import datetime
from app.agents.web_search_agent import web_search_agent
from app.services.enhanced_search_service import enhanced_search_service
from app.services.linkedin_profile_extractor import linkedin_profile_extractor

class SearchService:
    """Service for searching experts online with accurate profile detection"""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")
        self.google_cse_id = os.getenv("GOOGLE_CSE_ID", "")
        self.github_token = os.getenv("GITHUB_TOKEN", "")  # Optional: for GitHub API
        self.use_google_api = bool(self.google_api_key and self.google_cse_id)
        
        # Initialize caches
        self._profile_cache = {}
        
        # Article/Ad patterns to filter out
        self.article_patterns = [
            r'/article/', r'/blog/', r'/news/', r'/post/', r'/stories/',
            r'medium\.com', r'forbes\.com', r'techcrunch\.com', r'venturebeat\.com',
            r'businessinsider\.com', r'huffpost\.com', r'buzzfeed\.com',
            r'/amp/', r'\.amp', r'/sponsored/', r'/advertisement/',
            r'reddit\.com/r/', r'quora\.com/q/', r'stackoverflow\.com/questions/',
            r'youtube\.com/watch', r'vimeo\.com', r'/press-release/',
            r'slideshare\.net', r'scribd\.com', r'/whitepaper/',
            r'eventbrite\.com', r'meetup\.com', r'/webinar/'
        ]
        
        # Expert profile patterns to prioritize
        self.expert_patterns = [
            r'linkedin\.com/in/', r'github\.com/', r'twitter\.com/',
            r'researchgate\.net/profile/', r'scholar\.google\.com/citations',
            r'orcid\.org/', r'academia\.edu/', r'about\.me/',
            r'personal\.', r'portfolio\.', r'\.bio', r'/cv', r'/resume',
            r'faculty\.', r'staff\.', r'/people/', r'/team/', r'/profile/',
            r'angellist\.com/', r'behance\.net/', r'dribbble\.com/'
        ]
        
        # Professional platforms for focused search
        self.professional_platforms = {
            'linkedin': 'site:linkedin.com/in/',
            'github': 'site:github.com',
            'twitter': 'site:twitter.com',
            'researchgate': 'site:researchgate.net/profile',
            'scholar': 'site:scholar.google.com/citations',
            'angellist': 'site:angel.co',
            'personal': '-site:medium.com -site:forbes.com "portfolio" OR "resume" OR "cv"'
        }
    
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
            'ultimate guide', 'complete guide', 'everything you need',
            '10 ways', '5 steps', 'tutorial:', 'learn how'
        ]
        for keyword in article_title_keywords:
            if keyword in title_lower:
                return True
        
        # Check if it's a list/compilation article
        if re.search(r'\d+\s+(best|top|great|amazing|essential)', title_lower):
            return True
        
        # Check snippet for article-like content
        article_snippet_patterns = [
            'in this article', 'this post', 'read more',
            'continue reading', 'click here', 'subscribe',
            'sponsored by', 'advertisement', 'promoted',
            'this guide', 'tutorial shows', 'learn more about'
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
        # Look for typical name structures
        if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+', title):
            # Check if it has professional indicators
            prof_indicators = [
                'phd', 'dr.', 'dr ', 'prof', 'professor', 'engineer', 
                'developer', 'scientist', 'researcher', 'analyst', 
                'consultant', 'expert', 'specialist', 'architect', 
                'manager', 'director', 'founder', 'ceo', 'cto', 'designer'
            ]
            title_and_snippet = (title + ' ' + snippet).lower()
            for indicator in prof_indicators:
                if indicator in title_and_snippet:
                    return True
        
        return False
    
    async def _extract_github_profile(self, username: str) -> Optional[Dict]:
        """Extract profile data from GitHub API"""
        if not username:
            return None
            
        try:
            headers = {}
            if self.github_token:
                headers['Authorization'] = f'token {self.github_token}'
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f'https://api.github.com/users/{username}',
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'name': data.get('name') or username,
                        'bio': data.get('bio', ''),
                        'location': data.get('location', ''),
                        'company': data.get('company', ''),
                        'blog': data.get('blog', ''),
                        'email': data.get('email', ''),
                        'followers': data.get('followers', 0),
                        'public_repos': data.get('public_repos', 0),
                        'github_url': data.get('html_url'),
                        'avatar_url': data.get('avatar_url')
                    }
        except Exception as e:
            print(f"Error fetching GitHub profile: {e}")
        
        return None
    
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
        
        # Determine profile type and extract username
        profile_type = "unknown"
        username = None
        
        if 'linkedin.com/in/' in url:
            profile_type = "linkedin"
            match = re.search(r'linkedin\.com/in/([^/?]+)', url)
            if match:
                username = match.group(1)
        elif 'github.com/' in url:
            profile_type = "github"
            match = re.search(r'github\.com/([^/?]+)', url)
            if match:
                username = match.group(1)
        elif 'twitter.com/' in url:
            profile_type = "twitter"
            match = re.search(r'twitter\.com/([^/?]+)', url)
            if match:
                username = match.group(1)
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
        
        # Extract contact info and additional details
        email = self._extract_email_from_text(snippet + ' ' + title)
        location = self._extract_location_from_text(snippet)
        
        expert_data = {
            "id": f"{profile_type}_{username or name.lower().replace(' ', '_')}",
            "name": name or title.split(' - ')[0].strip(),
            "title": self._extract_title_from_snippet(snippet),
            "source": source,
            "url": url,
            "profile_url": url,
            "profile_type": profile_type,
            "username": username,
            "skills": skills,
            "bio": snippet,
            "location": location,
            "email": email,
            "match_score": min(base_score, 100),
            "is_verified_profile": profile_type != "unknown",
            "available_now": True,  # Default, can be updated later
            "response_time": "24 hours",
            "rating": 4.5,  # Default rating
            "total_reviews": 0,
            "hourly_rate": None,
            "website": url if profile_type == "professional" else None,
            "linkedin_url": url if profile_type == "linkedin" else None,
            "github_url": url if profile_type == "github" else None,
            "twitter_url": url if profile_type == "twitter" else None,
            "created_at": datetime.utcnow().isoformat()
        }
        
        return expert_data
    
    def _extract_name_from_title(self, title: str) -> Optional[str]:
        """Extract person's name from title"""
        # Remove common suffixes
        title = re.sub(r'\s*[-–|]\s*LinkedIn.*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*[-–|]\s*GitHub.*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*[-–|]\s*Twitter.*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\(@[^)]+\).*$', '', title)  # Remove Twitter handles
        
        # Check if it looks like a name (2-4 capitalized words)
        name_match = re.match(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})', title)
        if name_match:
            return name_match.group(1).strip()
        
        # Try to extract from "Name - Title" format
        if ' - ' in title:
            potential_name = title.split(' - ')[0].strip()
            if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+', potential_name):
                return potential_name
        
        return None
    
    def _extract_title_from_snippet(self, snippet: str) -> str:
        """Extract professional title from snippet"""
        # Look for common title patterns
        patterns = [
            r'(?:is\s+a|is\s+an|works\s+as|working\s+as)\s+([^.]+)',
            r'^([A-Z][^.]*(?:Engineer|Developer|Scientist|Researcher|Manager|Director|Consultant|Analyst|Architect|Designer)[^.]*)',
            r'([A-Z][^.]+\s+at\s+[A-Z][^.]+)',
            r'(?:^|\s)([A-Z][^.]*(?:PhD|Ph\.D\.|Dr\.|Professor|Prof\.)[^.]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, snippet)
            if match:
                title = match.group(1).strip()
                # Clean up the title
                title = re.sub(r'\s+', ' ', title)
                return title[:100]
        
        # Fallback to first sentence
        first_sentence = snippet.split('.')[0]
        return first_sentence[:100] if first_sentence else "Expert"
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills from text with improved detection"""
        skills = []
        text_lower = text.lower()
        
        # Comprehensive skill keywords
        skill_keywords = [
            # Programming languages
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node.js', 'nodejs', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
            'go', 'golang', 'rust', 'scala', 'r', 'matlab', 'julia',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
            'terraform', 'ansible', 'jenkins', 'ci/cd', 'devops', 'cloud',
            
            # Data & AI
            'machine learning', 'deep learning', 'ai', 'artificial intelligence',
            'data science', 'data analysis', 'tensorflow', 'pytorch', 'keras',
            'nlp', 'computer vision', 'neural networks', 'scikit-learn',
            
            # Databases
            'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'elasticsearch', 'cassandra', 'dynamodb', 'firebase',
            
            # Other technologies
            'blockchain', 'web3', 'solidity', 'ethereum', 'smart contracts',
            'iot', 'robotics', 'cybersecurity', 'security', 'networking',
            'microservices', 'api', 'rest', 'graphql', 'agile', 'scrum'
        ]
        
        # Extract skills
        for skill in skill_keywords:
            if skill in text_lower:
                # Capitalize appropriately
                if skill in ['aws', 'gcp', 'api', 'rest', 'sql', 'nosql', 'nlp', 'ai', 'iot']:
                    skills.append(skill.upper())
                elif skill == 'node.js':
                    skills.append('Node.js')
                elif skill == 'graphql':
                    skills.append('GraphQL')
                elif skill == 'ci/cd':
                    skills.append('CI/CD')
                else:
                    skills.append(skill.title())
        
        return list(set(skills))[:15]  # Return up to 15 unique skills
    
    def _extract_email_from_text(self, text: str) -> Optional[str]:
        """Extract email from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else None
    
    def _extract_location_from_text(self, text: str) -> Optional[str]:
        """Extract location from text"""
        # Common location patterns
        location_patterns = [
            r'(?:based in|located in|from|location:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b',  # City, State
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)'  # City, Country
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0).replace('based in', '').replace('located in', '').strip()
        
        return None
    
    async def search(
        self, 
        query: str,
        source: str = "all",
        limit: int = 10,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for experts online with improved accuracy"""
        
        if not query:
            return {"experts": [], "total": 0, "offset": offset, "has_more": False}
        
        # Build enhanced query for better results
        enhanced_queries = []
        
        # Add platform-specific searches
        if source == "all" or source == "linkedin":
            enhanced_queries.append(f'{query} {self.professional_platforms["linkedin"]}')
        
        if source == "all" or source == "github":
            enhanced_queries.append(f'{query} {self.professional_platforms["github"]}')
        
        if source == "all":
            # Add general professional search
            enhanced_queries.append(f'{query} "portfolio" OR "resume" OR "cv" -site:medium.com -site:forbes.com')
        
        all_experts = []
        
        # Execute searches in parallel
        if self.use_google_api:
            tasks = [self._google_custom_search(q, limit) for q in enhanced_queries]
            results = await asyncio.gather(*tasks)
            for expert_list in results:
                all_experts.extend(expert_list)
        else:
            # Use web scraping agent as fallback
            for enhanced_query in enhanced_queries:
                search_results = web_search_agent.search_google(enhanced_query, limit)
                
                # Convert search results to expert format
                for result in search_results:
                    expert_data = self._extract_expert_from_result(result, "Google Search")
                    if expert_data:
                        all_experts.append(expert_data)
        
        # Remove duplicates based on profile URL
        seen_urls = set()
        unique_experts = []
        for expert in all_experts:
            url = expert.get('profile_url', expert.get('url'))
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_experts.append(expert)
        
        # Sort by relevance and profile quality
        unique_experts.sort(key=lambda x: (
            x.get('is_verified_profile', False),
            x.get('match_score', 0)
        ), reverse=True)
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        paginated_experts = unique_experts[start_idx:end_idx]
        
        # Enhance with additional data if possible (e.g., GitHub API)
        for expert in paginated_experts:
            if expert.get('profile_type') == 'github' and expert.get('username'):
                github_data = await self._extract_github_profile(expert['username'])
                if github_data:
                    expert.update({
                        'bio': github_data.get('bio') or expert.get('bio'),
                        'location': github_data.get('location') or expert.get('location'),
                        'company': github_data.get('company'),
                        'website': github_data.get('blog') or expert.get('website'),
                        'avatar_url': github_data.get('avatar_url'),
                        'github_followers': github_data.get('followers'),
                        'github_repos': github_data.get('public_repos')
                    })
        
        return {
            "experts": paginated_experts,
            "total": len(unique_experts),
            "offset": offset,
            "has_more": end_idx < len(unique_experts),
            "query": query,
            "source": source
        }
    
    async def _google_custom_search(self, query: str, num_results: int) -> List[Dict]:
        """Use Google Custom Search API with improved parameters"""
        experts = []
        
        # Google CSE URL
        url = "https://www.googleapis.com/customsearch/v1"
        
        params = {
            "key": self.google_api_key,
            "cx": self.google_cse_id,
            "q": query,
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

# Create service instance
search_service = SearchService()