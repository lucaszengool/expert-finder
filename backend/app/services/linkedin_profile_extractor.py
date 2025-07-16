from typing import Dict, Optional, List
import re
from urllib.parse import urlparse

class LinkedInProfileExtractor:
    """
    Extract real LinkedIn profile information and differentiate between profiles and articles
    """
    
    def __init__(self):
        self.article_indicators = [
            '/pulse/', '/posts/', '/articles/', '/news/',
            '/feed/', '/company/', '/showcase/', '/school/'
        ]
        
        self.profile_indicators = [
            '/in/', '/pub/'  # LinkedIn profile URLs
        ]
    
    def is_linkedin_profile_url(self, url: str) -> bool:
        """Check if URL is a real LinkedIn profile (not article/company page)"""
        if 'linkedin.com' not in url.lower():
            return False
        
        # Check for profile indicators
        for indicator in self.profile_indicators:
            if indicator in url:
                # Make sure it's not followed by article indicators
                for article_ind in self.article_indicators:
                    if article_ind in url:
                        return False
                return True
        
        return False
    
    def is_linkedin_article(self, url: str) -> bool:
        """Check if URL is a LinkedIn article/post instead of a profile"""
        if 'linkedin.com' not in url.lower():
            return False
        
        for indicator in self.article_indicators:
            if indicator in url:
                return True
        
        return False
    
    def extract_username_from_url(self, url: str) -> Optional[str]:
        """Extract LinkedIn username from profile URL"""
        if not self.is_linkedin_profile_url(url):
            return None
        
        # Extract username from /in/username or /pub/username patterns
        match = re.search(r'/(?:in|pub)/([a-zA-Z0-9-]+)', url)
        if match:
            return match.group(1)
        
        return None
    
    def validate_profile_data(self, data: Dict) -> bool:
        """Validate that the data represents a real person's profile"""
        required_fields = ['name', 'url']
        
        # Check required fields
        for field in required_fields:
            if field not in data or not data[field]:
                return False
        
        # Check if URL is a profile
        if not self.is_linkedin_profile_url(data.get('url', '')):
            return False
        
        # Check name looks like a real person's name
        name = data.get('name', '')
        if not re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+', name):
            return False
        
        return True
    
    def clean_profile_data(self, data: Dict) -> Dict:
        """Clean and standardize profile data"""
        cleaned = {
            'platform': 'linkedin',
            'profile_type': 'professional',
            'is_verified': True
        }
        
        # Copy and clean fields
        if 'name' in data:
            cleaned['name'] = data['name'].strip()
        
        if 'url' in data:
            cleaned['url'] = data['url'].strip()
            cleaned['username'] = self.extract_username_from_url(cleaned['url'])
        
        if 'title' in data:
            cleaned['title'] = data['title'].strip()
        
        if 'company' in data:
            cleaned['company'] = data['company'].strip()
        
        if 'location' in data:
            cleaned['location'] = data['location'].strip()
        
        if 'bio' in data:
            cleaned['bio'] = data['bio'].strip()[:500]  # Limit bio length
        
        return cleaned

# Singleton instance
linkedin_profile_extractor = LinkedInProfileExtractor()