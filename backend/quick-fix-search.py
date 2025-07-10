#!/usr/bin/env python3
"""Quick fix for the search API error"""

import os

def fix_search_api():
    # Fix the SearchQuery model to include source and limit
    expert_model_path = 'app/models/expert.py'
    
    with open(expert_model_path, 'r') as f:
        content = f.read()
    
    # Find SearchQuery class and update it
    if 'class SearchQuery(BaseModel):' in content:
        # Replace the SearchQuery definition
        old_search_query = '''class SearchQuery(BaseModel):
    """Model for search queries"""
    query: str
    top_k: int = 5
    filters: Dict[str, Any] = {}
    include_scores: bool = False'''
        
        new_search_query = '''class SearchQuery(BaseModel):
    """Model for search queries"""
    query: str
    source: str = "all"  # all, linkedin, scholar
    limit: int = 10
    top_k: int = 5
    filters: Dict[str, Any] = {}
    include_scores: bool = False'''
        
        content = content.replace(old_search_query, new_search_query)
        
        with open(expert_model_path, 'w') as f:
            f.write(content)
        
        print("✅ Updated SearchQuery model with source and limit fields")
    
    # Alternative: Fix search.py to handle missing attributes gracefully
    search_api_path = 'app/api/search.py'
    
    with open(search_api_path, 'r') as f:
        search_content = f.read()
    
    # Replace the problematic line
    search_content = search_content.replace(
        'f"{query.query}:{query.source}:{query.limit}".encode()',
        'f"{query.query}:{getattr(query, \'source\', \'all\')}:{getattr(query, \'limit\', query.top_k)}".encode()'
    )
    
    with open(search_api_path, 'w') as f:
        f.write(search_content)
    
    print("✅ Updated search.py to handle missing attributes")
    
    print("\n🚀 Fix applied! Now restart the backend:")
    print("docker-compose restart backend")

if __name__ == "__main__":
    fix_search_api()
