#!/bin/bash
cd /Users/James/Desktop/expert-finder/backend

echo "🔍 Running pre-flight checks..."

# First run check without fixes
./preflight_check.py

# If it fails, run with auto-fix
if [ $? -ne 0 ]; then
    echo ""
    echo "🔧 Attempting auto-fix..."
    ./preflight_check.py --fix
    
    # Test again
    echo ""
    echo "🔍 Re-checking after fixes..."
    ./preflight_check.py --test
fi

# If all passes, build Docker
if [ $? -eq 0 ]; then
    echo ""
    echo "🚀 All checks passed! Building Docker..."
    cd ..
    docker-compose build backend
    docker-compose up -d backend
else
    echo ""
    echo "❌ Still have issues. Please fix manually."
fi
