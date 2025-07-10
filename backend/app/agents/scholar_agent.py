# from scholarly # import scholarly
from app.models.expert import Expert
import uuid

class ScholarAgent:
    def search_scholars(self, query: str, limit: int = 10):
        """Search Google Scholar for experts"""
        experts = []
        
        try:
            search_query = scholarly.search_author(query)
            
            for i, author in enumerate(search_query):
                if i >= limit:
                    break
                
                # Fill author details
                author_filled = scholarly.fill(author)
                
                expert = Expert(
                    id=str(uuid.uuid4()),
                    name=author_filled.get('name', ''),
                    title=author_filled.get('affiliation', ''),
                    bio=author_filled.get('interests', ''),
                    citations=author_filled.get('citedby', 0),
                    scholar_url=author_filled.get('url_picture', ''),
                    source="scholar",
                    skills=author_filled.get('interests', [])[:5] if author_filled.get('interests') else []
                )
                
                experts.append(expert)
        except Exception as e:
            print(f"Error searching scholars: {e}")
        
        return experts

scholar_agent = ScholarAgent()
