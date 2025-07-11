#!/bin/bash

# Commands to view all relevant backend files
# Run these commands and share the output so I can adjust based on your current logic

echo "=== VIEWING BACKEND FILES ==="
echo ""

echo "1. Main application file:"
echo "------------------------"
cat app/main.py
echo ""

echo "2. Search Service:"
echo "-----------------"
cat app/services/search_service.py
echo ""

echo "3. Enhanced Search Service:"
echo "--------------------------"
cat app/services/enhanced_search_service.py
echo ""

echo "4. Expert Service:"
echo "-----------------"
cat app/services/expert_service.py
echo ""

echo "5. API Routes:"
echo "--------------"
echo "Listing all route files:"
ls -la app/api/
echo ""

# Show the main routes if they exist
if [ -f "app/api/experts.py" ]; then
    echo "Expert routes:"
    cat app/api/experts.py
fi

if [ -f "app/api/search.py" ]; then
    echo "Search routes:"
    cat app/api/search.py
fi

echo ""
echo "6. Expert Model:"
echo "---------------"
cat app/models/expert.py
echo ""

echo "7. Database Models:"
echo "------------------"
cat app/models/db_models.py
echo ""

echo "8. Requirements:"
echo "---------------"
grep -E "openai|fastapi|sqlalchemy|pydantic" requirements.txt
echo ""

echo "9. Utils - Embeddings:"
echo "---------------------"
cat app/utils/embeddings.py
echo ""

echo "10. Check for existing email/AI code:"
echo "------------------------------------"
echo "Email-related files:"
find app -name "*.py" -type f -exec grep -l "email\|mail" {} \; 2>/dev/null
echo ""
echo "AI-related files:"
find app -name "*.py" -type f -exec grep -l "openai\|gpt\|ai_" {} \; 2>/dev/null
echo ""

echo "=== END OF FILE VIEWING ==="
