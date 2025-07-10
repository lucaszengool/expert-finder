#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🔧 Fixing remaining import issues..."
echo "=================================================="

# 1. First, let's see what get_collection is supposed to do
echo -e "\n1️⃣ Checking what get_collection does..."
grep -n "get_collection" app/services/expert_service.py

# 2. Update database.py to include get_collection for ChromaDB
echo -e "\n2️⃣ Adding get_collection to database.py..."
cat >> app/utils/database.py << 'EOF'

# ChromaDB collection getter (for backward compatibility)
def get_collection(collection_name):
    """Get ChromaDB collection by name"""
    from app.services.vector_search import vector_search_service
    
    if collection_name == "linkedin_experts":
        return vector_search_service.linkedin_collection
    elif collection_name == "scholar_experts":
        return vector_search_service.scholar_collection
    else:
        raise ValueError(f"Unknown collection: {collection_name}")
EOF

# 3. Fix the router prefix sed commands (macOS sed syntax issue)
echo -e "\n3️⃣ Properly fixing router prefixes..."

# Function to fix router with proper sed syntax for macOS
fix_router_properly() {
    local file=$1
    local prefix=$2
    local tag=${prefix#/api/}
    
    # Read the file
    content=$(cat "$file")
    
    # Check if it needs fixing
    if echo "$content" | grep -q "router = APIRouter()"; then
        # Replace router = APIRouter() with router = APIRouter(prefix="/api/...", tags=["..."])
        echo "$content" | sed "s|router = APIRouter()|router = APIRouter(prefix=\"$prefix\", tags=[\"$tag\"])|g" > "$file"
        echo "✓ Fixed router in $file"
    elif echo "$content" | grep -q "router = APIRouter(" && ! echo "$content" | grep -q "prefix="; then
        # Has APIRouter but no prefix
        echo "$content" | sed "s|router = APIRouter(|router = APIRouter(prefix=\"$prefix\", |g" > "$file"
        echo "✓ Updated router in $file"
    else
        echo "ℹ Router already has prefix in $file"
    fi
}

# Fix all routers
fix_router_properly "app/api/matching.py" "/api/matching"
fix_router_properly "app/api/marketplace.py" "/api/marketplace"
fix_router_properly "app/api/search.py" "/api/search"
fix_router_properly "app/api/enhanced_experts.py" "/api/enhanced-experts"
fix_router_properly "app/api/experts.py" "/api/experts"

# 4. Check if there are other import issues
echo -e "\n4️⃣ Checking for other import issues..."

# Create a more comprehensive test
cat > check_all_imports.py << 'EOF'
#!/usr/bin/env python3
import os
import sys
import importlib
import traceback

os.environ['TESTING'] = 'true'
os.environ['ANONYMIZED_TELEMETRY'] = 'false'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

failed_imports = []

# Test each module individually
modules_to_test = [
    "app.utils.database",
    "app.services.vector_search",
    "app.services.expert_service",
    "app.models.expert",
    "app.models.user",
    "app.models.marketplace",
    "app.models.search",
    "app.models.expert_dna",
    "app.api.experts",
    "app.api.search",
    "app.api.marketplace",
    "app.api.matching",
    "app.api.test_debug",
    "app.main"
]

for module in modules_to_test:
    try:
        importlib.import_module(module)
        print(f"✓ Successfully imported {module}")
    except Exception as e:
        print(f"✗ Failed to import {module}: {e}")
        failed_imports.append((module, str(e)))
        if "--verbose" in sys.argv:
            traceback.print_exc()

if failed_imports:
    print(f"\n❌ Failed to import {len(failed_imports)} modules")
    for module, error in failed_imports:
        print(f"  - {module}: {error}")
else:
    print("\n✅ All modules imported successfully!")
    
    # Try to import the app
    try:
        from app.main import app
        print("\n✓ App imported successfully!")
        print(f"  Routes: {len(app.routes)}")
    except Exception as e:
        print(f"\n✗ Failed to import app: {e}")
EOF

chmod +x check_all_imports.py

# 5. Run the import check
echo -e "\n5️⃣ Running import check..."
python3 check_all_imports.py

# 6. Fix vector_search service if needed
echo -e "\n6️⃣ Checking vector_search service..."
if [ ! -f "app/services/vector_search.py" ]; then
    echo "Creating vector_search.py..."
    cat > app/services/vector_search.py << 'EOF'
"""Vector search service using ChromaDB"""
import os
import chromadb
from chromadb.config import Settings

class VectorSearchService:
    def __init__(self):
        self.client = None
        self.linkedin_collection = None
        self.scholar_collection = None
        self._initialized = False
    
    def init_collections(self):
        """Initialize ChromaDB collections"""
        if self._initialized:
            return
        
        try:
            # Initialize ChromaDB client with telemetry disabled
            self.client = chromadb.PersistentClient(
                path="./chroma_db",
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collections
            try:
                self.linkedin_collection = self.client.get_collection("linkedin_experts")
                print("linkedin_experts collection already exists")
            except:
                self.linkedin_collection = self.client.create_collection("linkedin_experts")
                print("Created linkedin_experts collection")
            
            try:
                self.scholar_collection = self.client.get_collection("scholar_experts")
                print("scholar_experts collection already exists")
            except:
                self.scholar_collection = self.client.create_collection("scholar_experts")
                print("Created scholar_experts collection")
            
            self._initialized = True
            
        except Exception as e:
            print(f"Warning: Could not initialize ChromaDB: {e}")
            # Continue without vector search in testing mode
            if os.getenv("TESTING") == "true":
                self._initialized = True
            else:
                raise

# Global instance
vector_search_service = VectorSearchService()
EOF
    echo "✓ Created vector_search.py"
fi

# 7. Test again
echo -e "\n7️⃣ Final test..."
python3 test_local_no_db.py

if [ $? -eq 0 ]; then
    echo -e "\n✅ All issues fixed! Ready for Docker build."
    
    # Run the comprehensive test one more time
    echo -e "\n8️⃣ Running comprehensive test..."
    if [ -f "./test_before_docker.sh" ]; then
        ./test_before_docker.sh
    fi
else
    echo -e "\n❌ Some issues remain. Running verbose check..."
    python3 check_all_imports.py --verbose
fi

# Cleanup
rm -f check_all_imports.py test_local_no_db.py

echo -e "\n=================================================="
echo "Actions taken:"
echo "- Added get_collection function to database.py"
echo "- Fixed router prefix syntax for macOS"
echo "- Created/verified vector_search service"
echo "- Tested all imports"
echo "=================================================="
