#!/bin/bash

# Expert Finder Project Analysis Script

echo "=== BACKEND STRUCTURE ==="

# 1. Check the main backend entry point
echo -e "\n--- Main Entry Point ---"
cat backend/app/main.py

# 2. Check API endpoints
echo -e "\n=== API ENDPOINTS ==="
echo -e "\n--- API Init ---"
cat backend/app/api/__init__.py 2>/dev/null || echo "File not found"
echo -e "\n--- Experts API ---"
cat backend/app/api/experts.py 2>/dev/null || echo "File not found"
echo -e "\n--- Search API ---"
cat backend/app/api/search.py 2>/dev/null || echo "File not found"

# 3. Check models
echo -e "\n=== DATA MODELS ==="
echo -e "\n--- Models Init ---"
cat backend/app/models/__init__.py 2>/dev/null || echo "File not found"
echo -e "\n--- Expert Model ---"
cat backend/app/models/expert.py 2>/dev/null || echo "File not found"
echo -e "\n--- Database Model ---"
cat backend/app/models/database.py 2>/dev/null || echo "File not found"

# 4. Check services
echo -e "\n=== SERVICES ==="
echo -e "\n--- Services Init ---"
cat backend/app/services/__init__.py 2>/dev/null || echo "File not found"
echo -e "\n--- Expert Service ---"
cat backend/app/services/expert_service.py 2>/dev/null || echo "File not found"
echo -e "\n--- Search Service ---"
cat backend/app/services/search_service.py 2>/dev/null || echo "File not found"

# 5. Check utilities
echo -e "\n=== UTILITIES ==="
echo "Files in utils directory:"
ls backend/app/utils/ 2>/dev/null || echo "Directory not found"
echo -e "\n--- Cache Utility ---"
cat backend/app/utils/cache.py 2>/dev/null || echo "File not found"
echo -e "\n--- Embeddings Utility ---"
cat backend/app/utils/embeddings.py 2>/dev/null || echo "File not found"

# 6. Check requirements
echo -e "\n=== BACKEND DEPENDENCIES ==="
cat backend/requirements.txt

# Frontend Structure Analysis
echo -e "\n=== FRONTEND STRUCTURE ==="

# 7. Check main App component
echo -e "\n--- Main App Component ---"
cat frontend/src/App.js

# 8. Check all React components
echo -e "\n=== REACT COMPONENTS ==="
echo -e "\n--- SearchBar Component ---"
cat frontend/src/components/SearchBar.js
echo -e "\n--- ExpertResults Component ---"
cat frontend/src/components/ExpertResults.js
echo -e "\n--- ExpertCard Component ---"
cat frontend/src/components/ExpertCard.js

# 9. Check API service
echo -e "\n=== FRONTEND API SERVICE ==="
cat frontend/src/services/api.js

# 10. Check styles
echo -e "\n=== STYLES ==="
echo -e "\n--- App CSS ---"
cat frontend/src/styles/App.css
echo -e "\n--- Index CSS ---"
cat frontend/src/styles/index.css

# 11. Check package.json for dependencies
echo -e "\n=== FRONTEND DEPENDENCIES ==="
cat frontend/package.json

# 12. Check Docker configuration
echo -e "\n=== DOCKER CONFIG ==="
cat docker-compose.yml

# 13. Check if there are any environment files
echo -e "\n=== ENVIRONMENT FILES ==="
ls -la | grep -E "\.env|\.env\." || echo "No .env files found"

# 14. Check the current git status (if it's a git repo)
echo -e "\n=== GIT STATUS ==="
git status 2>/dev/null || echo "Not a git repository"

# 15. Check database schema if available
echo -e "\n=== DATABASE SCHEMA ==="
find . -name "*.sql" -o -name "alembic" -type d 2>/dev/null || echo "No SQL files or alembic directory found"

# 16. Check for any additional important files
echo -e "\n=== ADDITIONAL FILES ==="
echo "Files in backend/app/agents directory:"
ls backend/app/agents/ 2>/dev/null || echo "Directory not found"
echo -e "\nFiles in backend/data_processing directory:"
ls backend/data_processing/ 2>/dev/null || echo "Directory not found"

# 17. Create a summary of file counts
echo -e "\n=== PROJECT SUMMARY ==="
echo "Total Python files: $(find backend -name "*.py" 2>/dev/null | wc -l)"
echo "Total JavaScript files: $(find frontend -name "*.js" 2>/dev/null | wc -l)"
echo "Total CSS files: $(find frontend -name "*.css" 2>/dev/null | wc -l)"
echo "Total React components: $(find frontend/src/components -name "*.js" 2>/dev/null | wc -l)"

echo -e "\n=== ANALYSIS COMPLETE ==="
echo "Timestamp: $(date)"
