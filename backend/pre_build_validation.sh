#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "PRE-BUILD VALIDATION SCRIPT"
echo "========================================="

# Track errors
ERROR_COUNT=0
WARNING_COUNT=0

# Function to print results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        ((ERROR_COUNT++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNING_COUNT++))
}

# 1. Check Python syntax in all .py files
echo -e "\n${BLUE}1. CHECKING PYTHON SYNTAX${NC}"
syntax_errors=0
for file in $(find app -name "*.py" -type f); do
    python -m py_compile "$file" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗ Syntax error in $file${NC}"
        python -m py_compile "$file" 2>&1 | grep -A 2 "SyntaxError"
        ((syntax_errors++))
        ((ERROR_COUNT++))
    fi
done

if [ $syntax_errors -eq 0 ]; then
    echo -e "${GREEN}All Python files have valid syntax${NC}"
fi

# 2. Check for correct imports
echo -e "\n${BLUE}2. CHECKING IMPORTS${NC}"

# Check for the old incorrect import
if grep -r "from app.models.database import Base" app/ --include="*.py" 2>/dev/null | grep -v "app/utils/database.py"; then
    print_result 1 "Found incorrect database imports"
else
    print_result 0 "No incorrect database imports found"
fi

# Check that db_models.py has the correct import
if grep -q "from app.utils.database import Base" app/models/db_models.py; then
    print_result 0 "db_models.py has correct import"
else
    print_result 1 "db_models.py has incorrect import"
fi

# 3. Check for malformed __table_args__ (with colons or other syntax issues)
echo -e "\n${BLUE}3. CHECKING FOR CORRUPTED TABLE ARGS${NC}"
# Only check for actual syntax errors, not valid __table_args__
corrupted=$(grep -r "__table_args__.*:.*=" app/ --include="*.py" 2>/dev/null | wc -l)
if [ $corrupted -eq 0 ]; then
    print_result 0 "No corrupted __table_args__ found"
else
    print_result 1 "Found $corrupted corrupted __table_args__ lines:"
    grep -r "__table_args__.*:.*=" app/ --include="*.py" --color=always
fi

# 4. Check model files structure
echo -e "\n${BLUE}4. CHECKING MODEL FILES${NC}"

# Check that only db_models.py inherits from SQLAlchemy Base (not BaseModel)
sqlalchemy_models=$(grep -r "class.*Base):" app/models/ --include="*.py" | grep -v "BaseModel" | wc -l)
if [ $sqlalchemy_models -eq 1 ]; then
    print_result 0 "Only db_models.py has SQLAlchemy models"
else
    print_result 1 "Found $sqlalchemy_models SQLAlchemy model definitions (should be 1)"
    grep -r "class.*Base):" app/models/ --include="*.py" | grep -v "BaseModel"
fi

# Check that other model files use Pydantic BaseModel
pydantic_files=$(grep -l "from pydantic import.*BaseModel" app/models/*.py 2>/dev/null | wc -l)
if [ $pydantic_files -ge 4 ]; then
    print_result 0 "Found $pydantic_files Pydantic model files"
else
    print_warning "Only found $pydantic_files Pydantic model files (expected at least 4)"
fi

# 5. Check for circular imports
echo -e "\n${BLUE}5. CHECKING FOR CIRCULAR IMPORTS${NC}"
# Check if models/__init__.py imports from files that might import back
if grep -q "from app.models.db_models import" app/models/__init__.py 2>/dev/null; then
    print_warning "models/__init__.py imports from db_models - potential circular import"
else
    print_result 0 "No circular imports detected in models/__init__.py"
fi

# 6. Check matching.py endpoint structure
echo -e "\n${BLUE}6. CHECKING MATCHING ENDPOINT${NC}"

# Check if the matching endpoint expects the full preferences
if grep -q "preferred_work_styles" app/models/expert_dna.py; then
    if ! grep -q "from app.models.expert_dna import.*MatchingPreferences" app/api/matching.py; then
        print_warning "matching.py may not be using the full MatchingPreferences from expert_dna.py"
    else
        print_result 0 "matching.py imports MatchingPreferences from expert_dna"
    fi
fi

# Check if SmartMatchRequest exists
if grep -q "class SmartMatchRequest" app/api/matching.py; then
    print_result 0 "SmartMatchRequest class found"
else
    print_result 1 "SmartMatchRequest class not found in matching.py"
fi

# 7. Check service files
echo -e "\n${BLUE}7. CHECKING SERVICE FILES${NC}"

# Check if matching_service.py exists and has the right class
if [ -f "app/services/matching_service.py" ]; then
    if grep -q "class MatchingService" app/services/matching_service.py; then
        print_result 0 "MatchingService class found"
        # Check if it has match_experts_to_query method
        if grep -q "match_experts_to_query" app/services/matching_service.py; then
            print_result 0 "match_experts_to_query method found"
        else
            print_warning "match_experts_to_query method not found (using different method name)"
        fi
    else
        print_result 1 "MatchingService class not found"
    fi
else
    print_result 1 "matching_service.py not found"
fi

# 8. Check for missing dependencies in requirements.txt
echo -e "\n${BLUE}8. CHECKING REQUIREMENTS${NC}"
required_packages=("fastapi" "uvicorn" "sqlalchemy" "pydantic" "asyncpg" "redis" "psycopg2-binary")
for package in "${required_packages[@]}"; do
    if grep -qi "^$package" requirements.txt; then
        echo -e "${GREEN}✓${NC} $package found in requirements.txt"
    else
        print_result 1 "$package missing from requirements.txt"
    fi
done

# 9. Check file permissions (macOS compatible)
echo -e "\n${BLUE}9. CHECKING FILE PERMISSIONS${NC}"
non_readable=$(find app -name "*.py" -type f ! -perm -444 2>/dev/null | wc -l)
if [ $non_readable -eq 0 ]; then
    print_result 0 "All Python files are readable"
else
    print_result 1 "Found $non_readable non-readable Python files"
fi

# 10. Check for common issues in specific files
echo -e "\n${BLUE}10. CHECKING SPECIFIC FILES${NC}"

# Check if expert.py has proper imports and classes
if grep -q "from pydantic import BaseModel" app/models/expert.py; then
    print_result 0 "expert.py uses Pydantic BaseModel"
else
    print_result 1 "expert.py missing Pydantic import"
fi

# Check if required classes are defined
for class_name in "ExpertCreate" "ExpertUpdate" "Expert"; do
    if grep -q "class $class_name" app/models/expert.py; then
        print_result 0 "$class_name found in expert.py"
    else
        print_result 1 "$class_name not found in expert.py"
    fi
done

# 11. Docker-specific checks
echo -e "\n${BLUE}11. CHECKING DOCKER CONFIGURATION${NC}"

# Check if Dockerfile exists
if [ -f "Dockerfile" ]; then
    print_result 0 "Dockerfile found"
    
    # Check for proper COPY commands
    if grep -q "COPY \. \." Dockerfile; then
        print_result 0 "Dockerfile has COPY command"
    else
        print_result 1 "Dockerfile missing COPY . . command"
    fi
else
    print_result 1 "Dockerfile not found"
fi

# 12. Check for __pycache__ directories that might cause issues
echo -e "\n${BLUE}12. CHECKING FOR CACHE FILES${NC}"
cache_dirs=$(find app -type d -name "__pycache__" 2>/dev/null | wc -l)
pyc_files=$(find app -name "*.pyc" 2>/dev/null | wc -l)

if [ $cache_dirs -gt 0 ] || [ $pyc_files -gt 0 ]; then
    print_warning "Found $cache_dirs __pycache__ directories and $pyc_files .pyc files"
    echo "  Clean with: find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null"
    echo "  and: find . -name '*.pyc' -delete 2>/dev/null"
else
    print_result 0 "No Python cache files found"
fi

# Summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to build.${NC}"
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Clean cache: find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null"
    echo "2. Build: docker-compose build backend"
    echo "3. Run: docker-compose up -d backend"
elif [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠ No errors, but $WARNING_COUNT warnings found.${NC}"
    echo -e "You can proceed with the build, but review the warnings."
    echo -e "\n${YELLOW}Recommended steps:${NC}"
    echo "1. Review warnings above"
    echo "2. Clean cache: find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null"
    echo "3. Build: docker-compose build backend"
else
    echo -e "${RED}✗ Found $ERROR_COUNT errors and $WARNING_COUNT warnings.${NC}"
    echo -e "Please fix the errors before building."
fi

# Quick fix option
if [ $ERROR_COUNT -gt 0 ] || [ $WARNING_COUNT -gt 0 ]; then
    echo -e "\n${YELLOW}Would you like to apply quick fixes? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "\n${BLUE}Applying fixes...${NC}"
        
        # Add missing packages to requirements.txt
        for package in "asyncpg" "psycopg2-binary"; do
            if ! grep -qi "^$package" requirements.txt; then
                echo "$package" >> requirements.txt
                echo "Added $package to requirements.txt"
            fi
        done
        
        # Clean cache
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -name "*.pyc" -delete 2>/dev/null || true
        echo "Cleaned Python cache files"
        
        echo -e "\n${GREEN}Fixes applied! Run the validation again to verify.${NC}"
    fi
fi
