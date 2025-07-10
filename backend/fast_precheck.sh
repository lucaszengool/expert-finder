#!/bin/bash

# Fast pre-Docker build checker
# This script quickly validates your code WITHOUT installing dependencies or connecting to databases

cd /Users/James/Desktop/expert-finder/backend

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}⚡ FAST PRE-DOCKER BUILD CHECK${NC}"
echo "=================================================="
echo "This runs in seconds, not minutes!"
echo ""

ERRORS=0
WARNINGS=0

# 1. Check Python syntax (no imports needed)
echo -e "\n${BLUE}1. Checking Python syntax...${NC}"
python3 << 'EOF'
import ast
import os
from pathlib import Path

errors = 0
files_checked = 0

for py_file in Path("app").rglob("*.py"):
    if "__pycache__" in str(py_file):
        continue
    
    files_checked += 1
    try:
        with open(py_file, 'r') as f:
            ast.parse(f.read())
    except SyntaxError as e:
        print(f"❌ Syntax error in {py_file}:")
        print(f"   Line {e.lineno}: {e.msg}")
        errors += 1

if errors == 0:
    print(f"✅ All {files_checked} Python files have valid syntax")
else:
    print(f"❌ Found {errors} syntax errors")
    exit(1)
EOF

if [ $? -ne 0 ]; then
    ((ERRORS++))
fi

# 2. Check for required files
echo -e "\n${BLUE}2. Checking required files...${NC}"
REQUIRED_FILES=(
    "Dockerfile"
    "requirements.txt"
    ".env"
    "app/__init__.py"
    "app/main.py"
    "app/models/__init__.py"
    "app/api/__init__.py"
    "app/services/__init__.py"
    "app/utils/__init__.py"
    "app/utils/database.py"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ Missing: $file"
        ((ERRORS++))
    fi
done

# 3. Check imports WITHOUT executing them
echo -e "\n${BLUE}3. Checking import structure...${NC}"
python3 << 'EOF'
import re
import os
from pathlib import Path

print("Analyzing import dependencies...")

# Map of common import issues
issues = []
import_map = {}

for py_file in Path("app").rglob("*.py"):
    if "__pycache__" in str(py_file):
        continue
    
    with open(py_file, 'r') as f:
        content = f.read()
    
    # Extract imports
    imports = re.findall(r'^(?:from|import)\s+([^\s]+)', content, re.MULTILINE)
    import_map[str(py_file)] = imports
    
    # Check for common issues
    for imp in imports:
        if imp.startswith('app.'):
            # Check if local module exists
            module_path = imp.replace('.', '/')
            if not (Path(f"{module_path}.py").exists() or Path(module_path).is_dir()):
                issues.append(f"❌ {py_file}: imports non-existent module '{imp}'")

# Check for circular imports
print(f"✅ Checked imports in {len(import_map)} files")

if issues:
    print(f"\n⚠️  Found {len(issues)} potential import issues:")
    for issue in issues[:5]:  # Show first 5
        print(f"   {issue}")
    if len(issues) > 5:
        print(f"   ... and {len(issues) - 5} more")
else:
    print("✅ No obvious import issues found")
EOF

# 4. Validate .env file
echo -e "\n${BLUE}4. Checking .env configuration...${NC}"
if [ -f ".env" ]; then
    # Check for required variables
    REQUIRED_ENV=(
        "DATABASE_URL"
        "ANTHROPIC_API_KEY"
        "OPENAI_API_KEY"
    )
    
    for var in "${REQUIRED_ENV[@]}"; do
        if grep -q "^$var=" .env; then
            echo "✅ $var is set"
        else
            echo "⚠️  $var is not set in .env"
            ((WARNINGS++))
        fi
    done
else
    echo "❌ No .env file found"
    ((ERRORS++))
fi

# 5. Check Dockerfile
echo -e "\n${BLUE}5. Checking Dockerfile...${NC}"
if [ -f "Dockerfile" ]; then
    # Check for common Dockerfile issues
    if grep -q "FROM python:" Dockerfile; then
        echo "✅ Python base image found"
    else
        echo "❌ No Python base image in Dockerfile"
        ((ERRORS++))
    fi
    
    if grep -q "requirements.txt" Dockerfile; then
        echo "✅ requirements.txt referenced in Dockerfile"
    else
        echo "❌ requirements.txt not copied in Dockerfile"
        ((ERRORS++))
    fi
    
    if grep -q "EXPOSE" Dockerfile; then
        echo "✅ Port exposed in Dockerfile"
    else
        echo "⚠️  No EXPOSE directive in Dockerfile"
        ((WARNINGS++))
    fi
fi

# 6. Check docker-compose.yml
echo -e "\n${BLUE}6. Checking docker-compose.yml...${NC}"
if [ -f "../docker-compose.yml" ]; then
    # Quick YAML syntax check
    python3 -c "import yaml; yaml.safe_load(open('../docker-compose.yml'))" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml has syntax errors"
        ((ERRORS++))
    fi
    
    # Check for backend service
    if grep -q "backend:" ../docker-compose.yml; then
        echo "✅ Backend service defined"
    else
        echo "❌ No backend service in docker-compose.yml"
        ((ERRORS++))
    fi
else
    echo "❌ No docker-compose.yml found"
    ((ERRORS++))
fi

# 7. Quick check of main.py structure
echo -e "\n${BLUE}7. Checking main.py structure...${NC}"
python3 << 'EOF'
import re

try:
    with open('app/main.py', 'r') as f:
        content = f.read()
    
    checks = {
        'FastAPI app creation': 'app = FastAPI',
        'CORS middleware': 'CORSMiddleware',
        'Router includes': 'app.include_router',
        'Startup event': '@app.on_event("startup")',
        'Root endpoint': '@app.get("/")',
    }
    
    for check, pattern in checks.items():
        if pattern in content:
            print(f"✅ {check}")
        else:
            print(f"⚠️  Missing: {check}")
    
except Exception as e:
    print(f"❌ Error checking main.py: {e}")
EOF

# 8. Check requirements.txt
echo -e "\n${BLUE}8. Checking requirements.txt...${NC}"
if [ -f "requirements.txt" ]; then
    line_count=$(wc -l < requirements.txt)
    echo "✅ requirements.txt exists with $line_count packages"
    
    # Check for essential packages
    ESSENTIAL_PACKAGES=(
        "fastapi"
        "uvicorn"
        "sqlalchemy"
        "pydantic"
        "psycopg2"
    )
    
    for pkg in "${ESSENTIAL_PACKAGES[@]}"; do
        if grep -qi "^$pkg" requirements.txt; then
            echo "✅ $pkg found"
        else
            echo "❌ Missing essential package: $pkg"
            ((ERRORS++))
        fi
    done
else
    echo "❌ No requirements.txt found"
    ((ERRORS++))
fi

# Summary
echo -e "\n${BOLD}=================================================="
echo -e "SUMMARY${NC}"
echo "=================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for Docker build.${NC}"
    echo -e "\nRun: ${BOLD}docker-compose up -d --build${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No errors, but $WARNINGS warnings found.${NC}"
    echo -e "You can proceed with Docker build, but consider fixing warnings."
    echo -e "\nRun: ${BOLD}docker-compose up -d --build${NC}"
else
    echo -e "${RED}❌ Found $ERRORS errors and $WARNINGS warnings.${NC}"
    echo -e "Fix errors before building Docker!"
fi

echo -e "\n${BOLD}Time saved:${NC} This check took seconds instead of minutes!"
echo -e "${BOLD}Next step:${NC} Fix any errors above, then run Docker build."
