#!/bin/bash

# Backend Comprehensive Analysis Script
# Run this to get a complete overview of your backend structure

echo "=== BACKEND STRUCTURE ANALYSIS ==="
echo ""

# Check Python version
echo "1. Python Environment:"
python --version
echo ""

# List all directories and key files
echo "2. Directory Structure:"
find . -type d -name "__pycache__" -prune -o -type d -print | head -20
echo ""

# Show main app structure
echo "3. Main App Files:"
ls -la app/
echo ""

# Show all routes/endpoints
echo "4. API Routes (from main.py):"
grep -n "@app\|@router" app/main.py 2>/dev/null || echo "main.py not found in app/"
echo ""

# Show models structure
echo "5. Database Models:"
ls -la app/models/
echo ""

# Show services
echo "6. Services:"
ls -la app/services/
echo ""

# Check for email and AI related endpoints
echo "7. Email/AI Related Code:"
echo "   - Email endpoints:"
grep -r "email\|mail" app/ --include="*.py" | grep -E "(def|class|@)" | head -10
echo ""
echo "   - AI/OpenAI endpoints:"
grep -r "openai\|gpt\|ai_" app/ --include="*.py" | grep -E "(def|class|@)" | head -10
echo ""

# Check for LinkedIn scraping
echo "8. LinkedIn/Scraping Code:"
grep -r "linkedin\|scrape" app/ --include="*.py" | head -10
echo ""

# Show requirements
echo "9. Key Dependencies:"
grep -E "openai|langchain|fastapi|linkedin|beautifulsoup|selenium" requirements.txt
echo ""

# Check for environment variables
echo "10. Environment Configuration:"
if [ -f ".env" ]; then
    echo "   .env file exists"
    grep -E "OPENAI|EMAIL|SMTP|LINKEDIN" .env | sed 's/=.*/=***/'
else
    echo "   No .env file found"
fi
echo ""

# Show database schema
echo "11. Database Schema (from models):"
grep -r "Column\|Table" app/models/ --include="*.py" | head -15
echo ""

# Check for existing email service
echo "12. Email Service Implementation:"
if [ -f "app/services/email_service.py" ]; then
    echo "   email_service.py exists"
    head -20 app/services/email_service.py
else
    echo "   No email_service.py found"
fi
echo ""

# Check for AI service
echo "13. AI Service Implementation:"
if [ -f "app/services/ai_service.py" ]; then
    echo "   ai_service.py exists"
    head -20 app/services/ai_service.py
else
    echo "   No ai_service.py found"
fi

echo ""
echo "=== END OF ANALYSIS ==="
