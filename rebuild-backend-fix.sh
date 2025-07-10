#!/bin/bash

cd /Users/James/Desktop/expert-finder

echo "🛑 Stopping backend..."
docker-compose stop backend

echo -e "\n🔧 Applying fixes to the code..."
cd backend

# Fix 1: Update SearchQuery model
cat > fix_models.py << 'EOF'
#!/usr/bin/env python3
import re

# Read the expert.py file
with open('app/models/expert.py', 'r') as f:
    content = f.read()

# Check if SearchQuery needs updating
if 'class SearchQuery' in content and 'source:' not in content:
    print("📝 Updating SearchQuery model...")
    
    # Find and replace the SearchQuery class
    pattern = r'(class SearchQuery\(BaseModel\):[^}]+?)(\n\nclass|\n\n# |\Z)'
    
    new_search_query = '''class SearchQuery(BaseModel):
    """Model for search queries"""
    query: str
    source: str = "all"  # all, linkedin, scholar
    limit: int = 10
    top_k: int = 5
    filters: Dict[str, Any] = {}
    include_scores: bool = False'''
    
    content = re.sub(pattern, new_search_query + r'\2', content, flags=re.DOTALL)
    
    with open('app/models/expert.py', 'w') as f:
        f.write(content)
    
    print("✅ Updated SearchQuery model")
else:
    print("ℹ️  SearchQuery already has source field or not found")

# Fix 2: Update search.py to handle the attributes safely
with open('app/api/search.py', 'r') as f:
    search_content = f.read()

if 'query.source' in search_content:
    print("📝 Updating search.py...")
    
    # Make the cache key generation more robust
    search_content = search_content.replace(
        'f"{query.query}:{query.source}:{query.limit}".encode()',
        'f"{query.query}:{getattr(query, \'source\', \'all\')}:{getattr(query, \'limit\', getattr(query, \'top_k\', 10))}".encode()'
    )
    
    with open('app/api/search.py', 'w') as f:
        f.write(search_content)
    
    print("✅ Updated search.py")
EOF

python3 fix_models.py

# Show the updated SearchQuery model
echo -e "\n📄 Updated SearchQuery model:"
grep -A10 "class SearchQuery" app/models/expert.py

echo -e "\n🏗️ Rebuilding backend container..."
cd ..
docker-compose build backend

echo -e "\n🚀 Starting backend with fixes..."
docker-compose up -d backend

echo -e "\n📊 Checking logs..."
sleep 5
docker-compose logs --tail=20 backend

echo -e "\n✅ Backend should now be working properly!"
echo -e "\n💡 To view live logs: docker-compose logs -f backend"
