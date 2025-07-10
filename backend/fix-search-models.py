#!/usr/bin/env python3
"""
Script to fix the search model imports issue
"""
import os
import re

def fix_search_imports():
    """Fix the SearchQuery and SearchResult import issues"""
    
    # Path to the search.py file
    search_file = "app/api/search.py"
    expert_model_file = "app/models/expert.py"
    
    # Read the search.py file
    with open(search_file, 'r') as f:
        search_content = f.read()
    
    # Read the expert.py file to check what's available
    with open(expert_model_file, 'r') as f:
        expert_content = f.read()
    
    # Check if SearchQuery and SearchResult exist in expert.py
    has_search_query = 'class SearchQuery' in expert_content
    has_search_result = 'class SearchResult' in expert_content
    
    if not has_search_query or not has_search_result:
        print("❌ SearchQuery and/or SearchResult not found in expert.py")
        
        # Option 1: Add them to expert.py
        if not has_search_query and not has_search_result:
            print("📝 Adding SearchQuery and SearchResult to expert.py...")
            
            # Add necessary imports if not present
            if 'from typing import Dict, Any' not in expert_content:
                expert_content = expert_content.replace(
                    'from typing import',
                    'from typing import Dict, Any,'
                )
            
            # Add the classes at the end
            additional_models = '''

# Search models
class SearchQuery(BaseModel):
    """Model for search queries"""
    query: str
    top_k: int = 5
    filters: Dict[str, Any] = {}
    include_scores: bool = False

class SearchResult(BaseModel):
    """Model for search results"""
    experts: List[Expert]
    total: int
    page: int = 1
    per_page: int = 10
    query: str = ""
'''
            
            with open(expert_model_file, 'w') as f:
                f.write(expert_content + additional_models)
            
            print("✅ Added SearchQuery and SearchResult to expert.py")
        
        # Option 2: Create them inline in search.py
        else:
            print("📝 Creating models inline in search.py...")
            
            # Replace the import with inline definitions
            search_content = search_content.replace(
                'from app.models.expert import SearchQuery, SearchResult',
                '''from app.models.expert import Expert
from pydantic import BaseModel
from typing import List, Dict, Any

# Define search models locally
class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    filters: Dict[str, Any] = {}

class SearchResult(BaseModel):
    experts: List[Expert]
    total: int
    page: int = 1
    per_page: int = 10'''
            )
            
            with open(search_file, 'w') as f:
                f.write(search_content)
            
            print("✅ Created models inline in search.py")
    else:
        print("✅ SearchQuery and SearchResult already exist in expert.py")

def check_and_fix_all():
    """Run all fixes"""
    print("🔧 Starting fixes...")
    
    # Fix search imports
    fix_search_imports()
    
    # Fix cache.py localhost reference
    cache_file = "app/utils/cache.py"
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            content = f.read()
        
        if 'localhost' in content:
            content = content.replace('localhost', 'redis')
            with open(cache_file, 'w') as f:
                f.write(content)
            print("✅ Fixed localhost reference in cache.py")
    
    # Update requirements.txt
    with open('requirements.txt', 'r') as f:
        requirements = f.read()
    
    missing_packages = []
    if 'scholarly' not in requirements:
        missing_packages.append('scholarly')
    if 'prometheus-client' not in requirements:
        missing_packages.append('prometheus-client')
    
    if missing_packages:
        with open('requirements.txt', 'a') as f:
            for package in missing_packages:
                f.write(f"\n{package}")
        print(f"✅ Added missing packages to requirements.txt: {', '.join(missing_packages)}")
    
    print("\n✨ All fixes applied!")
    print("\nNext steps:")
    print("1. Run: ./preflight_check.py --test")
    print("2. If all passes, run: cd .. && docker-compose build backend")

if __name__ == "__main__":
    check_and_fix_all()
