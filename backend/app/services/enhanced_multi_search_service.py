from typing import List, Dict, Any, Optional
import httpx
import asyncio
from app.services.search_service import SearchService
import re

class EnhancedMultiSearchService(SearchService):
    """Extended search service for multiple target types with AI enhancement"""
    
    async def search_targets(
        self,
        query: str,
        target_type: str = "all",
        location: Optional[str] = None,
        industry: Optional[str] = None,
        size: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Universal search for any target type"""
        
        # Route to appropriate search method based on target type
        if target_type == "expert":
            targets = await self._search_experts_enhanced(query, location, limit)
        elif target_type == "agency":
            targets = await self._search_agencies(query, location, industry, limit)
        elif target_type == "client":
            targets = await self._search_potential_clients(query, industry, size, location, limit)
        elif target_type == "shop":
            targets = await self._search_local_shops(query, location, limit)
        else:  # "all"
            # Search all types and combine
            results = await asyncio.gather(
                self._search_experts_enhanced(query, location, limit // 4),
                self._search_agencies(query, location, industry, limit // 4),
                self._search_potential_clients(query, industry, size, location, limit // 4),
                self._search_local_shops(query, location, limit // 4)
            )
            targets = []
            for result in results:
                targets.extend(result)
        
        return {
            "targets": targets,
            "total": len(targets),
            "query": query,
            "filters": {
                "target_type": target_type,
                "location": location,
                "industry": industry,
                "size": size
            }
        }
    
    async def _search_experts_enhanced(
        self,
        query: str,
        location: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search for experts with enhanced data"""
        search_query = query
        if location:
            search_query += f" {location}"
        
        # Use parent class search method
        results = await self.search(
            query=search_query,
            source="all",
            limit=limit
        )
        
        # Transform to target format
        targets = []
        for expert in results.get("experts", []):
            target = {
                "id": expert.get("id"),
                "type": "expert",
                "name": expert.get("name"),
                "email": self._extract_or_generate_email(expert),
                "title": expert.get("title"),
                "company": expert.get("organization"),
                "location": expert.get("location"),
                "profile_url": expert.get("profile_url") or expert.get("website"),
                "skills": expert.get("skills", []),
                "hourly_rate": expert.get("hourly_rate"),
                "rating": expert.get("rating"),
                "bio": expert.get("bio"),
                "confidence_score": expert.get("relevance_score", 0.8)
            }
            targets.append(target)
        
        return targets
    
    async def _search_agencies(
        self,
        query: str,
        location: Optional[str] = None,
        specialization: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search for agencies"""
        search_query = f"{query} agency"
        if location:
            search_query += f" {location}"
        if specialization:
            search_query += f" {specialization}"
        
        # Use Google API or web scraping
        results = await self._google_custom_search(search_query, limit)
        
        targets = []
        for idx, result in enumerate(results):
            # Extract agency info from search results
            name = self._extract_agency_name(result.get('title', ''))
            
            target = {
                "id": f"agency_{hash(result.get('link', ''))}",
                "type": "agency",
                "name": name,
                "email": self._generate_agency_email(name),
                "title": "Business Development",
                "company": name,
                "location": location or self._extract_location(result.get('snippet', '')),
                "profile_url": result.get('link'),
                "specialization": specialization,
                "description": result.get('snippet'),
                "services": self._extract_services(result.get('snippet', '')),
                "confidence_score": 0.75 - (idx * 0.02)
            }
            targets.append(target)
        
        return targets
    
    async def _search_potential_clients(
        self,
        query: str,
        industry: Optional[str] = None,
        size: Optional[str] = None,
        location: Optional[str] = None,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        """Search for potential client companies"""
        search_query = f"{query} companies"
        if industry:
            search_query += f" {industry}"
        if size:
            search_query += f" {size}"
        if location:
            search_query += f" {location}"
        
        results = await self._google_custom_search(search_query, limit)
        
        targets = []
        for idx, result in enumerate(results):
            company_name = self._extract_company_name(result.get('title', ''))
            
            target = {
                "id": f"client_{hash(result.get('link', ''))}",
                "type": "client",
                "name": company_name,
                "email": self._generate_company_email(company_name),
                "title": "Decision Maker",
                "company": company_name,
                "industry": industry,
                "size": size,
                "location": location or self._extract_location(result.get('snippet', '')),
                "profile_url": result.get('link'),
                "description": result.get('snippet'),
                "confidence_score": 0.7 - (idx * 0.02)
            }
            targets.append(target)
        
        return targets
    
    async def _search_local_shops(
        self,
        business_type: str,
        location: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search for local shops/businesses"""
        search_query = f"{business_type} near {location}"
        
        # This would ideally use Google Places API
        results = await self._google_custom_search(search_query, limit)
        
        targets = []
        for idx, result in enumerate(results):
            business_name = self._extract_business_name(result.get('title', ''))
            
            target = {
                "id": f"shop_{hash(result.get('link', ''))}",
                "type": "shop",
                "name": business_name,
                "email": self._generate_business_email(business_name),
                "title": "Owner/Manager",
                "company": business_name,
                "location": location,
                "profile_url": result.get('link'),
                "business_type": business_type,
                "description": result.get('snippet'),
                "confidence_score": 0.65 - (idx * 0.02)
            }
            targets.append(target)
        
        return targets
    
    # Helper methods
    def _extract_agency_name(self, title: str) -> str:
        """Extract agency name from search result title"""
        # Remove common suffixes
        name = re.sub(r' - Digital.*| - Marketing.*| - Creative.*| \|.*', '', title)
        return name.strip()
    
    def _extract_company_name(self, title: str) -> str:
        """Extract company name from search result title"""
        # Remove common patterns
        name = re.sub(r' - .*| \|.*| Inc\.?| LLC| Ltd\.?| Corp\.?', '', title)
        return name.strip()
    
    def _extract_business_name(self, title: str) -> str:
        """Extract business name from search result title"""
        name = re.sub(r' - .*| \|.*| Reviews| Hours| Menu', '', title)
        return name.strip()
    
    def _extract_location(self, text: str) -> str:
        """Try to extract location from text"""
        # Simple pattern matching for cities/states
        patterns = [
            r'in ([A-Z][a-z]+ ?[A-Z]?[a-z]*,? ?[A-Z]{2})',
            r'based in ([A-Z][a-z]+ ?[A-Z]?[a-z]*)',
            r'located in ([A-Z][a-z]+ ?[A-Z]?[a-z]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        
        return "Unknown"
    
    def _extract_services(self, text: str) -> List[str]:
        """Extract services from description"""
        service_keywords = [
            'SEO', 'PPC', 'social media', 'web design', 'branding',
            'content marketing', 'email marketing', 'digital marketing',
            'consulting', 'development', 'strategy'
        ]
        
        found_services = []
        text_lower = text.lower()
        for service in service_keywords:
            if service.lower() in text_lower:
                found_services.append(service)
        
        return found_services[:5]  # Limit to 5 services
    
    def _extract_or_generate_email(self, expert: Dict) -> str:
        """Extract email or generate a plausible one"""
        if expert.get('email'):
            return expert['email']
        
        # Generate email from name
        name = expert.get('name', 'contact')
        first_name = name.split()[0].lower() if name else 'contact'
        
        # Common professional email patterns
        domains = ['gmail.com', 'outlook.com', 'protonmail.com']
        return f"{first_name}@{domains[hash(name) % len(domains)]}"
    
    def _generate_agency_email(self, agency_name: str) -> str:
        """Generate plausible agency email"""
        clean_name = re.sub(r'[^a-zA-Z0-9]', '', agency_name.lower())
        return f"hello@{clean_name[:20]}.com"
    
    def _generate_company_email(self, company_name: str) -> str:
        """Generate plausible company email"""
        clean_name = re.sub(r'[^a-zA-Z0-9]', '', company_name.lower())
        return f"info@{clean_name[:20]}.com"
    
    def _generate_business_email(self, business_name: str) -> str:
        """Generate plausible business email"""
        clean_name = re.sub(r'[^a-zA-Z0-9]', '', business_name.lower())
        return f"contact@{clean_name[:20]}.com"

# Create singleton instance
enhanced_multi_search_service = EnhancedMultiSearchService()
