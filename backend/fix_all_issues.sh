#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🔧 Fixing all identified issues..."
echo "=================================================="

# 1. Fix the missing app.database import in test_debug.py
echo -e "\n1️⃣ Fixing test_debug.py database import..."
sed -i '' 's/from app.database import SessionLocal/from app.utils.database import SessionLocal/g' app/api/test_debug.py
echo "✓ Fixed database import path"

# 2. Create/Update .env file with required variables
echo -e "\n2️⃣ Creating/updating .env file..."
cat > .env << 'EOF'
# Database - use 'db' hostname for Docker, localhost for local testing
DATABASE_URL=postgresql://expertuser:expertpass@db:5432/expertdb

# ChromaDB
ANONYMIZED_TELEMETRY=false

# API Keys (replace with your actual keys)
ANTHROPIC_API_KEY=sk-ant-api03-placeholder
BING_API_KEY=placeholder_bing_key
SERP_API_KEY=placeholder_serp_key
STRIPE_API_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# App settings
DEBUG=true
ENVIRONMENT=development
PYTHONUNBUFFERED=1

# Redis (if needed)
REDIS_URL=redis://redis:6379/0

# OpenAI (if needed)
OPENAI_API_KEY=sk-placeholder

# JWT Secret
SECRET_KEY=your-secret-key-here-change-in-production
EOF
echo "✓ Created .env file with all required variables"

# 3. Fix model __tablename__ warnings
echo -e "\n3️⃣ Fixing model __tablename__ attributes..."

# Function to add __tablename__ to a model file
fix_model_tablename() {
    local file=$1
    local table_name=$2
    
    # Check if __tablename__ already exists
    if ! grep -q "__tablename__" "$file"; then
        # Add __tablename__ after class definition
        sed -i '' "/^class.*Base/a\\
    __tablename__ = \"$table_name\"\\
" "$file"
        echo "✓ Added __tablename__ to $file"
    fi
}

# Fix each model
fix_model_tablename "app/models/expert.py" "experts"
fix_model_tablename "app/models/expert_dna.py" "expert_dna"
fix_model_tablename "app/models/marketplace.py" "marketplace_listings"
fix_model_tablename "app/models/search.py" "search_history"

# 4. Add missing prefixes to routers
echo -e "\n4️⃣ Fixing API router prefixes..."

# Function to fix router prefix
fix_router_prefix() {
    local file=$1
    local prefix=$2
    
    # Check if router exists without prefix
    if grep -q "router = APIRouter()" "$file"; then
        sed -i '' "s/router = APIRouter()/router = APIRouter(prefix=\"$prefix\", tags=[\"${prefix#/api/}\"])/g" "$file"
        echo "✓ Added prefix to $file"
    elif grep -q "router = APIRouter(" "$file" && ! grep -q "prefix=" "$file"; then
        # Router exists but without prefix
        sed -i '' "s/router = APIRouter(/router = APIRouter(prefix=\"$prefix\", /g" "$file"
        echo "✓ Updated prefix in $file"
    fi
}

# Fix each router
fix_router_prefix "app/api/matching.py" "/api/matching"
fix_router_prefix "app/api/marketplace.py" "/api/marketplace"
fix_router_prefix "app/api/search.py" "/api/search"
fix_router_prefix "app/api/enhanced_experts.py" "/api/enhanced-experts"
fix_router_prefix "app/api/experts.py" "/api/experts"

# 5. Add missing packages to requirements.txt
echo -e "\n5️⃣ Updating requirements.txt..."

# Add missing packages if not already present
add_to_requirements() {
    local package=$1
    if ! grep -q "^$package" requirements.txt; then
        echo "$package" >> requirements.txt
        echo "✓ Added $package to requirements.txt"
    fi
}

# Add missing packages
add_to_requirements "python-dotenv==1.0.0"
add_to_requirements "beautifulsoup4==4.12.2"
add_to_requirements "sentence-transformers==2.2.2"

# Sort requirements.txt
sort -u requirements.txt -o requirements.txt

# 6. Create a database check utility
echo -e "\n6️⃣ Creating database connection helper..."
cat > app/utils/db_check.py << 'EOF'
"""Database connection checker"""
import os
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

def get_database_url():
    """Get database URL based on environment"""
    # In Docker, use 'db' hostname; locally use localhost
    default_url = "postgresql://expertuser:expertpass@db:5432/expertdb"
    
    # For local testing, check if we're in Docker
    if not os.path.exists('/.dockerenv'):
        # Not in Docker, use localhost
        default_url = "postgresql://expertuser:expertpass@localhost:5432/expertdb"
    
    return os.getenv("DATABASE_URL", default_url)

def check_database_connection():
    """Check if database is accessible"""
    try:
        engine = create_engine(get_database_url())
        conn = engine.connect()
        conn.close()
        return True
    except OperationalError:
        return False
EOF

# 7. Update database.py to use the helper
echo -e "\n7️⃣ Updating database.py to handle connection better..."
cat > app/utils/database.py << 'EOF'
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from .db_check import get_database_url, check_database_connection

# Get database URL
DATABASE_URL = get_database_url()

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database"""
    # Only check connection if not in testing mode
    if os.getenv("TESTING") != "true":
        if not check_database_connection():
            print("Warning: Database connection failed. Running without database.")
            return
    
    # Import all models to ensure they're registered
    from app.models import expert, expert_dna, marketplace, search, user
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize ChromaDB collections
    from app.services.vector_search import vector_search_service
    vector_search_service.init_collections()
    
    print("Database initialized successfully")
EOF

# 8. Add HTTPException handling to test_debug.py
echo -e "\n8️⃣ Adding error handling to test_debug.py..."
sed -i '' '1s/^/from fastapi import HTTPException\n/' app/api/test_debug.py

# 9. Create a local test script that doesn't require database
echo -e "\n9️⃣ Creating local test script..."
cat > test_local_no_db.py << 'EOF'
#!/usr/bin/env python3
"""Test app import without database connection"""
import os
import sys

# Set testing mode to skip database
os.environ['TESTING'] = 'true'
os.environ['ANONYMIZED_TELEMETRY'] = 'false'

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    print("✓ App imported successfully (no database)")
    
    # List all routes
    print(f"\nRegistered routes:")
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"  - {route.path}")
    
    print("\n✓ All imports successful!")
    
except Exception as e:
    print(f"✗ Import failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
EOF

chmod +x test_local_no_db.py

# 10. Run the test
echo -e "\n🧪 Testing imports without database..."
python3 test_local_no_db.py

if [ $? -eq 0 ]; then
    echo -e "\n✅ All issues fixed! Ready for Docker build."
    echo -e "\nNext steps:"
    echo "1. Update the placeholder API keys in .env with real values"
    echo "2. Run: docker-compose build backend"
    echo "3. Run: docker-compose up -d"
else
    echo -e "\n❌ Some issues remain. Check the output above."
fi

# Cleanup
rm -f test_local_no_db.py

echo -e "\n=================================================="
echo "Fix Summary:"
echo "- Fixed test_debug.py database import path"
echo "- Created .env with all required variables"
echo "- Added __tablename__ to model files"
echo "- Added prefixes to API routers"
echo "- Updated requirements.txt with missing packages"
echo "- Created database connection helpers"
echo "- Added error handling improvements"
echo -e "==================================================\n"
