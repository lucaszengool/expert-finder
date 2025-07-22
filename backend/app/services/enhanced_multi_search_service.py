# backend/app/services/enhanced_multi_search_service.py
from typing import List, Dict, Any, Optional
import os
import httpx
import asyncio
from app.services.search_service import SearchService
from app.agents.web_search_agent import web_search_agent
import re

class EnhancedMultiSearchService(SearchService):
    """Enhanced search service for multiple target types"""
    
    def __init__(self):
        super().__init__()
        self.search_strategies = {
            "experts": self._search_experts,
            "agencies": self._search_agencies,
            "clients": self._search_potential_clients,
            "shops": self._search_local_shops,
            "companies": self._search_companies,
            "influencers": self._search_influencers,
            "partners": self._search_partners
        }
    
    async def search_targets(
        self,
        query: str,
        target_type: str = "all",
        location: Optional[str] = None,
        industry: Optional[str] = None,
        size: Optional[str] = None,
        limit: int = 50,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for different types of targets based on query and type"""
        
        # Build enhanced query based on parameters
        enhanced_query = self._build_enhanced_query(query, target_type, location, industry)
        
        # Use appropriate search strategy
        if target_type in self.search_strategies:
            results = await self.search_strategies[target_type](
                enhanced_query, location, industry, size, limit, filters
            )
        else:
            # Search all types
            results = await self._search_all_types(
                enhanced_query, location, industry, size, limit, filters
            )
        
        # Enrich results with additional data
        enriched_results = await self._enrich_results(results, target_type)
        
        return {
            "targets": enriched_results,
            "total": len(enriched_results),
            "query": query,
            "target_type": target_type,
            "filters_applied": filters
        }
    
    def _build_enhanced_query(
        self, 
        base_query: str, 
        target_type: str,
        location: Optional[str],
        industry: Optional[str]
    ) -> str:
        """Build an enhanced search query based on parameters"""
        
        query_parts = [base_query]
        
        # Add target type modifiers
        type_modifiers = {
            "agencies": "agency digital marketing advertising",
            "clients": "looking for services needs help with",
            "shops": "store shop retail business",
            "companies": "company corporation business",
            "influencers": "influencer content creator social media",
            "partners": "partnership collaboration strategic alliance"
        }
        
        if target_type in type_modifiers:
            query_parts.append(type_modifiers[target_type])
        
        # Add location if specified
        if location:
            query_parts.append(f'"{location}"')
        
        # Add industry if specified
        if industry:
            query_parts.append(industry)
        
        return " ".join(query_parts)
    
    async def _search_experts(
        self, query: str, location: Optional[str], 
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for experts using existing logic"""
        results = await super().search(query, "all", limit, 0, filters)
        return results.get("experts", [])
    
    async def _search_agencies(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for agencies"""
        
        # Use multiple search strategies
        search_queries = [
            f"{query} agency",
            f"{industry} agencies {location}" if industry and location else None,
            f"top {query} agencies",
            f"{query} consulting firms"
        ]
        
        all_results = []
        for search_query in search_queries:
            if search_query:
                results = web_search_agent.search_google(search_query, limit // len(search_queries))
                
                for idx, result in enumerate(results):
                    agency_data = {
                        "id": f"agency_{idx}_{hash(result.get('url', ''))}",
                        "name": self._extract_agency_name(result),
                        "type": "agency",
                        "description": result.get('snippet', ''),
                        "website": result.get('url', ''),
                        "services": self._extract_services(result.get('snippet', '')),
                        "location": location or self._extract_location(result.get('snippet', '')),
                        "size": size or self._estimate_company_size(result),
                        "industry_focus": industry or self._extract_industry(result.get('snippet', '')),
                        "contact_url": result.get('url', ''),
                        "match_score": 85 - (idx * 5)
                    }
                    all_results.append(agency_data)
        
        return all_results[:limit]
    
    async def _search_potential_clients(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for potential clients"""
        
        # Build queries to find companies that might need services
        search_queries = [
            f"companies need {query} services",
            f"{industry} companies {location} challenges" if industry else None,
            f"businesses looking for {query}",
            f"{query} RFP tender opportunities"
        ]
        
        all_results = []
        for search_query in search_queries:
            if search_query:
                results = web_search_agent.search_google(search_query, limit // len(search_queries))
                
                for idx, result in enumerate(results):
                    client_data = {
                        "id": f"client_{idx}_{hash(result.get('url', ''))}",
                        "name": self._extract_company_name(result),
                        "type": "potential_client",
                        "description": result.get('snippet', ''),
                        "website": result.get('url', ''),
                        "industry": industry or self._extract_industry(result.get('snippet', '')),
                        "location": location or self._extract_location(result.get('snippet', '')),
                        "size": size or self._estimate_company_size(result),
                        "pain_points": self._extract_pain_points(result.get('snippet', '')),
                        "contact_url": result.get('url', ''),
                        "match_score": 80 - (idx * 5)
                    }
                    all_results.append(client_data)
        
        return all_results[:limit]
    
    async def _search_local_shops(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for local shops and businesses"""
        
        if not location:
            location = "near me"
        
        # Search for local businesses
        search_queries = [
            f"{query} shops {location}",
            f"{query} stores {location}",
            f"local {query} businesses {location}",
            f"{query} retailers {location}"
        ]
        
        all_results = []
        for search_query in search_queries:
            results = web_search_agent.search_google(search_query, limit // len(search_queries))
            
            for idx, result in enumerate(results):
                shop_data = {
                    "id": f"shop_{idx}_{hash(result.get('url', ''))}",
                    "name": self._extract_shop_name(result),
                    "type": "local_shop",
                    "description": result.get('snippet', ''),
                    "website": result.get('url', ''),
                    "address": self._extract_address(result.get('snippet', '')),
                    "phone": self._extract_phone(result.get('snippet', '')),
                    "hours": self._extract_hours(result.get('snippet', '')),
                    "category": industry or query,
                    "location": location,
                    "contact_url": result.get('url', ''),
                    "match_score": 75 - (idx * 5)
                }
                all_results.append(shop_data)
        
        return all_results[:limit]
    
    async def _search_companies(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for companies"""
        
        search_queries = [
            f"{query} companies {location}" if location else f"{query} companies",
            f"{industry} companies {size}" if industry and size else None,
            f"leading {query} companies"
        ]
        
        all_results = []
        for search_query in search_queries:
            if search_query:
                results = web_search_agent.search_google(search_query, limit // len(search_queries))
                
                for idx, result in enumerate(results):
                    company_data = {
                        "id": f"company_{idx}_{hash(result.get('url', ''))}",
                        "name": self._extract_company_name(result),
                        "type": "company",
                        "description": result.get('snippet', ''),
                        "website": result.get('url', ''),
                        "industry": industry or self._extract_industry(result.get('snippet', '')),
                        "location": location or self._extract_location(result.get('snippet', '')),
                        "size": size or self._estimate_company_size(result),
                        "contact_url": result.get('url', ''),
                        "match_score": 80 - (idx * 5)
                    }
                    all_results.append(company_data)
        
        return all_results[:limit]
    
    async def _search_influencers(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for influencers and content creators"""
        
        platforms = ["LinkedIn", "Twitter", "Instagram", "YouTube", "TikTok"]
        all_results = []
        
        for platform in platforms:
            search_query = f"{query} {platform} influencer"
            if location:
                search_query += f" {location}"
            
            results = web_search_agent.search_google(search_query, limit // len(platforms))
            
            for idx, result in enumerate(results):
                influencer_data = {
                    "id": f"influencer_{platform}_{idx}_{hash(result.get('url', ''))}",
                    "name": self._extract_influencer_name(result),
                    "type": "influencer",
                    "platform": platform,
                    "description": result.get('snippet', ''),
                    "profile_url": result.get('url', ''),
                    "niche": industry or query,
                    "follower_count": self._extract_follower_count(result.get('snippet', '')),
                    "engagement_topics": self._extract_topics(result.get('snippet', '')),
                    "location": location or self._extract_location(result.get('snippet', '')),
                    "contact_url": result.get('url', ''),
                    "match_score": 75 - (idx * 5)
                }
                all_results.append(influencer_data)
        
        return all_results[:limit]
    
    async def _search_partners(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search for potential partners"""
        
        search_queries = [
            f"{query} strategic partners",
            f"{query} partnership opportunities",
            f"companies partnering on {query}",
            f"{industry} partnership {location}" if industry and location else None
        ]
        
        all_results = []
        for search_query in search_queries:
            if search_query:
                results = web_search_agent.search_google(search_query, limit // len(search_queries))
                
                for idx, result in enumerate(results):
                    partner_data = {
                        "id": f"partner_{idx}_{hash(result.get('url', ''))}",
                        "name": self._extract_company_name(result),
                        "type": "potential_partner",
                        "description": result.get('snippet', ''),
                        "website": result.get('url', ''),
                        "partnership_areas": self._extract_partnership_areas(result.get('snippet', '')),
                        "industry": industry or self._extract_industry(result.get('snippet', '')),
                        "location": location or self._extract_location(result.get('snippet', '')),
                        "size": size or self._estimate_company_size(result),
                        "contact_url": result.get('url', ''),
                        "match_score": 80 - (idx * 5)
                    }
                    all_results.append(partner_data)
        
        return all_results[:limit]
    
    async def _search_all_types(
        self, query: str, location: Optional[str],
        industry: Optional[str], size: Optional[str],
        limit: int, filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search all target types"""
        
        # Run searches in parallel
        tasks = []
        for target_type, search_func in self.search_strategies.items():
            task = search_func(query, location, industry, size, limit // len(self.search_strategies), filters)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # Flatten and sort by match score
        all_results = []
        for result_set in results:
            all_results.extend(result_set)
        
        all_results.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        return all_results[:limit]
    
    async def _enrich_results(
        self, 
        results: List[Dict[str, Any]], 
        target_type: str
    ) -> List[Dict[str, Any]]:
        """Enrich search results with additional data"""
        
        enriched = []
        for result in results:
            # Try to find email addresses
            if result.get('website'):
                result['potential_emails'] = self._generate_potential_emails(
                    result.get('name', ''),
                    result.get('website', '')
                )
            
            # Add engagement suggestions based on type
            result['engagement_suggestions'] = self._get_engagement_suggestions(
                target_type,
                result
            )
            
            enriched.append(result)
        
        return enriched
    
    # Extraction helper methods
    def _extract_agency_name(self, result: Dict[str, Any]) -> str:
        title = result.get('title', '')
        # Remove common suffixes
        name = re.sub(r'( - Digital Agency| - Marketing Agency| Agency| - Home)', '', title)
        return name.strip()
    
    def _extract_company_name(self, result: Dict[str, Any]) -> str:
        title = result.get('title', '')
        # Remove common suffixes
        name = re.sub(r'( - Official Site| - Homepage| Inc\.| LLC| Ltd\.)', '', title)
        return name.strip()
    
    def _extract_shop_name(self, result: Dict[str, Any]) -> str:
        title = result.get('title', '')
        name = re.sub(r'( - Local Business| - Store| - Shop)', '', title)
        return name.strip()
    
    def _extract_influencer_name(self, result: Dict[str, Any]) -> str:
        title = result.get('title', '')
        # Extract name from social media titles
        name = re.sub(r'(@|on Twitter|on Instagram|on LinkedIn| - YouTube)', '', title)
        return name.strip()
    
    def _extract_services(self, text: str) -> List[str]:
        """Extract services mentioned in text"""
        service_keywords = [
            'marketing', 'design', 'development', 'consulting',
            'strategy', 'branding', 'SEO', 'advertising',
            'social media', 'content', 'analytics', 'automation'
        ]
        
        services = []
        text_lower = text.lower()
        for keyword in service_keywords:
            if keyword in text_lower:
                services.append(keyword)
        
        return services[:5]  # Limit to 5 services
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location from text"""
        # Look for city, state patterns
        location_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})'
        match = re.search(location_pattern, text)
        if match:
            return f"{match.group(1)}, {match.group(2)}"
        return None
    
    def _extract_industry(self, text: str) -> Optional[str]:
        """Extract industry from text"""
        industries = [
            'technology', 'healthcare', 'finance', 'retail',
            'manufacturing', 'education', 'real estate',
            'hospitality', 'automotive', 'energy'
        ]
        
        text_lower = text.lower()
        for industry in industries:
            if industry in text_lower:
                return industry.title()
        return None
    
    def _estimate_company_size(self, result: Dict[str, Any]) -> str:
        """Estimate company size from search result"""
        text = result.get('snippet', '').lower()
        
        if any(word in text for word in ['fortune 500', 'global', 'multinational']):
            return "enterprise"
        elif any(word in text for word in ['medium-sized', 'mid-size', 'regional']):
            return "medium"
        elif any(word in text for word in ['startup', 'small business', 'local']):
            return "small"
        else:
            return "unknown"
    
    def _extract_pain_points(self, text: str) -> List[str]:
        """Extract potential pain points from text"""
        pain_keywords = {
            'challenge': 'facing challenges',
            'struggle': 'struggling with',
            'need': 'in need of',
            'looking for': 'actively looking for solutions',
            'problem': 'experiencing problems'
        }
        
        pain_points = []
        text_lower = text.lower()
        for keyword, description in pain_keywords.items():
            if keyword in text_lower:
                pain_points.append(description)
        
        return pain_points
    
    def _extract_address(self, text: str) -> Optional[str]:
        """Extract address from text"""
        # Simple pattern for street addresses
        address_pattern = r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)'
        match = re.search(address_pattern, text)
        if match:
            return match.group(0)
        return None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        phone_pattern = r'(\+?1?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})'
        match = re.search(phone_pattern, text)
        if match:
            return match.group(1)
        return None
    
    def _extract_hours(self, text: str) -> Optional[str]:
        """Extract business hours from text"""
        hours_pattern = r'(\d{1,2}(?::\d{2})?\s*[AaPp][Mm]\s*-\s*\d{1,2}(?::\d{2})?\s*[AaPp][Mm])'
        match = re.search(hours_pattern, text)
        if match:
            return match.group(1)
        return None
    
    def _extract_follower_count(self, text: str) -> Optional[str]:
        """Extract follower count from text"""
        count_pattern = r'(\d+(?:\.\d+)?[KMB]?)\s*(?:followers|subscribers)'
        match = re.search(count_pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
        return None
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics from text"""
        # This would be more sophisticated in production
        words = text.lower().split()
        topics = [word for word in words if len(word) > 5 and word.isalpha()]
        return list(set(topics))[:5]
    
    def _extract_partnership_areas(self, text: str) -> List[str]:
        """Extract partnership areas from text"""
        partnership_keywords = [
            'technology', 'distribution', 'marketing',
            'product development', 'research', 'sales',
            'integration', 'co-branding', 'strategic alliance'
        ]
        
        areas = []
        text_lower = text.lower()
        for keyword in partnership_keywords:
            if keyword in text_lower:
                areas.append(keyword)
        
        return areas
    
    def _generate_potential_emails(self, name: str, website: str) -> List[str]:
        """Generate potential email addresses"""
        if not name or not website:
            return []
        
        # Extract domain from website
        domain = re.sub(r'https?://(www\.)?', '', website)
        domain = domain.split('/')[0]
        
        # Common email patterns
        first_name = name.split()[0].lower() if name else ""
        last_name = name.split()[-1].lower() if len(name.split()) > 1 else ""
        
        patterns = [
            f"info@{domain}",
            f"contact@{domain}",
            f"hello@{domain}",
            f"{first_name}@{domain}",
            f"{first_name}.{last_name}@{domain}",
            f"{first_name[0]}{last_name}@{domain}" if first_name and last_name else None
        ]
        
        return [p for p in patterns if p][:3]  # Return top 3
    
    def _get_engagement_suggestions(
        self, 
        target_type: str, 
        result: Dict[str, Any]
    ) -> List[str]:
        """Get engagement suggestions based on target type"""
        
        suggestions = {
            "agency": [
                "Discuss potential collaboration opportunities",
                "Request case studies in your industry",
                "Schedule a capabilities presentation"
            ],
            "potential_client": [
                "Share relevant case studies",
                "Offer a free consultation or audit",
                "Demonstrate ROI with specific examples"
            ],
            "local_shop": [
                "Offer location-specific solutions",
                "Suggest in-person meeting",
                "Provide local market insights"
            ],
            "influencer": [
                "Propose content collaboration",
                "Discuss sponsored opportunities",
                "Offer exclusive partnership terms"
            ],
            "company": [
                "Research their recent initiatives",
                "Align with their business goals",
                "Offer tailored solutions"
            ],
            "potential_partner": [
                "Explore mutual benefits",
                "Suggest pilot project",
                "Discuss revenue sharing models"
            ]
        }
        
        return suggestions.get(result.get('type', 'company'), [
            "Personalize your approach",
            "Focus on value proposition",
            "Request initial conversation"
        ])

# Singleton instance
enhanced_multi_search_service = EnhancedMultiSearchService()