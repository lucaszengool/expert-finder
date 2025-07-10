#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "COMPREHENSIVE BACKEND TEST SUITE"
echo "========================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000$endpoint)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method http://localhost:8000$endpoint \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        print_result 0 "Status code: $response (expected: $expected_status)"
        return 0
    else
        print_result 1 "Status code: $response (expected: $expected_status)"
        return 1
    fi
}

# 1. Check if backend is running
echo -e "\n${YELLOW}1. CHECKING BACKEND CONTAINER STATUS${NC}"
if docker ps | grep -q expert-finder-backend-1; then
    print_result 0 "Backend container is running"
else
    print_result 1 "Backend container is not running"
    echo "Starting backend..."
    docker-compose up -d backend
    sleep 10
fi

# 2. Check logs for errors
echo -e "\n${YELLOW}2. CHECKING FOR STARTUP ERRORS${NC}"
error_count=$(docker-compose logs backend --tail=100 | grep -c "ERROR\|Exception\|Traceback" || true)
if [ $error_count -eq 0 ]; then
    print_result 0 "No errors found in logs"
else
    print_result 1 "Found $error_count errors in logs"
    echo "Recent errors:"
    docker-compose logs backend --tail=20 | grep -A 2 -B 2 "ERROR\|Exception" || true
fi

# 3. Test basic endpoints
echo -e "\n${YELLOW}3. TESTING BASIC ENDPOINTS${NC}"

# Health check
test_endpoint "GET" "/health" "" "200" "Health check endpoint"

# Root endpoint
test_endpoint "GET" "/" "" "200" "Root endpoint"

# Test debug endpoint
test_endpoint "GET" "/api/test/health" "" "200" "Test health endpoint"

# 4. Test Expert endpoints
echo -e "\n${YELLOW}4. TESTING EXPERT ENDPOINTS${NC}"

# List experts
test_endpoint "GET" "/api/experts" "" "200" "List all experts"

# Get specific expert (might be 404 if no experts exist)
test_endpoint "GET" "/api/experts/test-id" "" "404" "Get non-existent expert"

# Create expert
expert_data='{
    "name": "Test Expert",
    "title": "AI Specialist",
    "email": "test@example.com",
    "bio": "Test bio",
    "skills": ["Python", "Machine Learning"],
    "location": "San Francisco"
}'
test_endpoint "POST" "/api/experts" "$expert_data" "200" "Create new expert"

# 5. Test Search endpoints
echo -e "\n${YELLOW}5. TESTING SEARCH ENDPOINTS${NC}"

# Basic search
search_data='{
    "query": "Python developer",
    "filters": {
        "skills": ["Python"],
        "location": "San Francisco"
    }
}'
test_endpoint "POST" "/api/search" "$search_data" "200" "Basic search"

# 6. Test Matching endpoints
echo -e "\n${YELLOW}6. TESTING MATCHING ENDPOINTS${NC}"

# Smart match with simple preferences
simple_match_data='{
    "query": "AI expert",
    "preferences": {
        "skills_weight": 0.4,
        "experience_weight": 0.3,
        "location_weight": 0.2,
        "availability_weight": 0.1
    },
    "limit": 5
}'
test_endpoint "POST" "/api/matching/smart-match" "$simple_match_data" "200" "Smart match with simple preferences"

# Smart match with full preferences (the one causing issues)
full_match_data='{
    "query": "Need AI expert for machine learning project",
    "preferences": {
        "user_id": "1",
        "preferred_work_styles": ["collaborative"],
        "preferred_communication_styles": ["technical"],
        "preferred_languages": ["English"],
        "preferred_time_zones": ["PST"],
        "industry_preferences": ["Technology"],
        "skill_priorities": ["Python", "Machine Learning", "AI"],
        "project_timeline": "3 months",
        "team_size_preference": "SMALL",
        "budget_range": {
            "min": 5000,
            "max": 10000
        }
    },
    "limit": 5
}'
test_endpoint "POST" "/api/matching/smart-match" "$full_match_data" "200" "Smart match with full preferences"

# 7. Test Marketplace endpoints
echo -e "\n${YELLOW}7. TESTING MARKETPLACE ENDPOINTS${NC}"

# List marketplace items
test_endpoint "GET" "/api/marketplace/listings" "" "200" "List marketplace listings"

# 8. Check database connection
echo -e "\n${YELLOW}8. CHECKING DATABASE CONNECTION${NC}"
db_check=$(docker exec expert-finder-backend-1 python -c "
from app.utils.database import engine
try:
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('SUCCESS')
except Exception as e:
    print(f'ERROR: {e}')
" 2>&1)

if [[ $db_check == *"SUCCESS"* ]]; then
    print_result 0 "Database connection successful"
else
    print_result 1 "Database connection failed: $db_check"
fi

# 9. Check imports
echo -e "\n${YELLOW}9. CHECKING PYTHON IMPORTS${NC}"
import_check=$(docker exec expert-finder-backend-1 python -c "
try:
    from app.models.db_models import ExpertDB
    from app.services.matching_service import matching_service
    from app.services.expert_service import ExpertService
    from app.utils.database import Base
    print('SUCCESS: All imports working')
except Exception as e:
    print(f'ERROR: {e}')
" 2>&1)

if [[ $import_check == *"SUCCESS"* ]]; then
    print_result 0 "All Python imports successful"
else
    print_result 1 "Import errors: $import_check"
fi

# 10. Check file contents
echo -e "\n${YELLOW}10. CHECKING FILE CONTENTS${NC}"

# Check db_models.py import
db_models_check=$(docker exec expert-finder-backend-1 grep "from app.utils.database import Base" /app/app/models/db_models.py 2>/dev/null)
if [ -n "$db_models_check" ]; then
    print_result 0 "db_models.py has correct import"
else
    print_result 1 "db_models.py has incorrect import"
    echo "Current import:"
    docker exec expert-finder-backend-1 grep "import Base" /app/app/models/db_models.py || true
fi

# Check for extend_existing in models
extend_check=$(docker exec expert-finder-backend-1 grep -r "extend_existing" /app/app/models/ --include="*.py" | wc -l)
if [ $extend_check -gt 0 ]; then
    print_result 0 "Found $extend_check models with extend_existing"
else
    print_result 1 "No models have extend_existing set"
fi

# 11. Memory and resource check
echo -e "\n${YELLOW}11. CHECKING CONTAINER RESOURCES${NC}"
stats=$(docker stats expert-finder-backend-1 --no-stream --format "CPU: {{.CPUPerc}} | Memory: {{.MemUsage}}")
echo "Container stats: $stats"

# Summary
echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}=========================================${NC}"

# Count successes and failures
success_count=$(grep -c "✓" $0 || true)
failure_count=$(grep -c "✗" $0 || true)

if [ $failure_count -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Backend is working correctly.${NC}"
    echo -e "${GREEN}You can proceed with rebuilding the image.${NC}"
else
    echo -e "${RED}Some tests failed. Please fix the issues before rebuilding.${NC}"
    echo -e "Successes: $success_count"
    echo -e "Failures: $failure_count"
fi

# Offer to show full logs
echo -e "\n${YELLOW}Would you like to see the full backend logs? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    docker-compose logs backend --tail=100
fi

# Offer to rebuild
if [ $failure_count -eq 0 ]; then
    echo -e "\n${YELLOW}Would you like to rebuild the backend image now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Rebuilding backend image..."
        docker-compose build backend
        echo -e "${GREEN}Build complete! Restart with: docker-compose up -d backend${NC}"
    fi
fi
