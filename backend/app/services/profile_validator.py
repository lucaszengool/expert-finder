# app/services/profile_validator.py
import re
from typing import Dict, Tuple, Optional
from urllib.parse import urlparse

class StrictProfileValidator:
    """
    Strictly validate that experts come from personal profiles only
    """
    
    def __init__(self):
        # Valid personal profile patterns
        self.valid_profile_patterns = [
            r'^https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9\-]+/?$',  # LinkedIn personal profiles only
            r'^https?://(?:www\.)?github\.com/[a-zA-Z0-9\-]+/?$',       # GitHub profiles
            r'^https?://(?:www\.)?twitter\.com/[a-zA-Z0-9_]+/?$',       # Twitter profiles
        ]
        
        # Invalid URL patterns - reject these immediately
        self.invalid_patterns = [
            '/pulse/',      # LinkedIn articles
            '/posts/',      # LinkedIn posts
            '/activity/',   # LinkedIn activity
            '/article/',    # Articles
            '/blog/',       # Blog posts
            '/news/',       # News articles
            '/events/',     # Events
            '/jobs/',       # Job postings
            '/learning/',   # Learning content
            '/courses/',    # Courses
            '/showcase/',   # Company showcases
            '/company/',    # Company pages (not personal)
            '/school/',     # School pages
            '/groups/',     # Group pages
            '/feed/',       # Feed items
            '/detail/',     # Detail pages
            'medium.com',   # Medium articles
            'substack.com', # Substack newsletters
            'youtube.com/watch', # YouTube videos
            'facebook.com/posts', # Facebook posts
        ]
        
        # Valid personal website patterns
        self.personal_website_indicators = [
            'portfolio',
            'personal',
            'about',
            'cv',
            'resume',
            'bio'
        ]
        
        # Company/org indicators to filter out
        self.org_indicators = [
            'linkedin learning',
            'coursera',
            'udemy',
            'udacity',
            'edx',
            'skillshare',
            'masterclass',
            'training',
            'courses',
            'platform',
            'framework',
            'foundation',
            'institute',
            'academy',
            'university', # unless it's a professor's page
            'college',
            'school'
        ]
    
    def is_valid_linkedin_profile(self, url: str) -> bool:
        """Check if URL is a valid LinkedIn personal profile"""
        if not url:
            return False
            
        # Must match the exact LinkedIn profile pattern
        pattern = r'^https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9\-]+/?$'
        return bool(re.match(pattern, url.strip()))
    
    def is_invalid_url(self, url: str) -> bool:
        """Check if URL contains any invalid patterns"""
        if not url:
            return True
            
        url_lower = url.lower()
        return any(pattern in url_lower for pattern in self.invalid_patterns)
    
    def validate_expert_source(self, expert_data: Dict) -> Tuple[bool, str, Dict]:
        """
        Strictly validate expert source
        Returns: (is_valid, reason, cleaned_data)
        """
        # Check name for org indicators
        name = expert_data.get('name', '').lower()
        for indicator in self.org_indicators:
            if indicator in name:
                return False, f"Organization/platform detected: {indicator}", expert_data
        
        # Check if it's from a valid source
        profile_url = expert_data.get('profile_url', '')
        source_url = expert_data.get('source_url', profile_url)
        
        # Reject if URL contains invalid patterns
        if self.is_invalid_url(source_url):
            return False, "Source is an article/post/invalid page", expert_data
        
        # Validate LinkedIn profiles
        if 'linkedin.com' in source_url:
            if not self.is_valid_linkedin_profile(source_url):
                return False, "Not a valid LinkedIn personal profile", expert_data
            # Valid LinkedIn profile
            expert_data['source_type'] = 'linkedin_profile'
            expert_data['verified_profile'] = True
            return True, "Valid LinkedIn profile", expert_data
        
        # Check for other valid profile sites
        for pattern in self.valid_profile_patterns:
            if re.match(pattern, source_url):
                expert_data['source_type'] = 'verified_profile'
                expert_data['verified_profile'] = True
                return True, "Valid profile site", expert_data
        
        # For other websites, check if it's a personal/company site
        if self._is_personal_website(source_url, expert_data):
            expert_data['source_type'] = 'personal_website'
            return True, "Valid personal/company website", expert_data
        
        return False, "Not from a valid personal profile or website", expert_data
    
    def _is_personal_website(self, url: str, expert_data: Dict) -> bool:
        """Check if it's a legitimate personal or company website"""
        if not url:
            return False
            
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Check if it's a personal domain (e.g., johnsmith.com)
            name_parts = expert_data.get('name', '').lower().split()
            for part in name_parts:
                if part in domain:
                    return True
            
            # Check for personal website indicators in path
            path = parsed.path.lower()
            for indicator in self.personal_website_indicators:
                if indicator in path:
                    return True
            
            # Check if it's a known company domain
            company = expert_data.get('company', '').lower()
            if company and company in domain:
                return True
                
        except:
            return False
            
        return False
    
    def extract_profile_from_search_result(self, search_result: Dict) -> Optional[Dict]:
        """
        Extract valid profile information from search results
        """
        url = search_result.get('url', '')
        
        # Skip if invalid URL
        if self.is_invalid_url(url):
            return None
        
        # Try to extract LinkedIn profile
        if 'linkedin.com' in url:
            # Look for profile URL in the content
            profile_match = re.search(r'linkedin\.com/in/([a-zA-Z0-9\-]+)', url)
            if profile_match:
                username = profile_match.group(1)
                return {
                    'profile_url': f'https://www.linkedin.com/in/{username}/',
                    'source_type': 'linkedin_profile',
                    'username': username
                }
        
        return None

# Singleton instance
profile_validator = StrictProfileValidator()