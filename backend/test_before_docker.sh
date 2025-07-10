#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Navigate to backend directory
cd /Users/James/Desktop/expert-finder/backend

# Track all issues
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to print colored output
print_status() {
    if [ "$1" = "success" ]; then
        echo -e "${GREEN}✓${NC} $2"
    elif [ "$1" = "error" ]; then
        echo -e "${RED}✗${NC} $2"
        ((ISSUES_FOUND++))
    elif [ "$1" = "warning" ]; then
        echo -e "${YELLOW}⚠${NC} $2"
        ((WARNINGS_FOUND++))
    elif [ "$1" = "info" ]; then
        echo -e "${BLUE}ℹ${NC} $2"
    elif [ "$1" = "header" ]; then
        echo -e "\n${BOLD}$2${NC}"
        echo "================================================================"
    fi
}

# Create comprehensive test script
cat > comprehensive_test.py << 'EOF'
#!/usr/bin/env python3
import os
import sys
import ast
import json
import subprocess
from pathlib import Path
import importlib.util
import re
import tempfile

class TestResults:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.successes = []

results = TestResults()

def check_python_syntax():
    """Check all Python files for syntax errors"""
    print("\n🔍 Checking Python Syntax...")
    error_count = 0
    
    for py_file in Path("app").rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
        
        try:
            with open(py_file, 'r') as f:
                ast.parse(f.read())
            results.successes.append(f"Syntax OK: {py_file}")
        except SyntaxError as e:
            error_count += 1
            results.errors.append(f"Syntax error in {py_file} line {e.lineno}: {e.msg}")
            
            # Show context
            with open(py_file, 'r') as f:
                lines = f.readlines()
            if e.lineno and e.lineno <= len(lines):
                context = lines[max(0, e.lineno-2):min(len(lines), e.lineno+1)]
                for i, line in enumerate(context):
                    line_num = max(1, e.lineno-1) + i
                    prefix = ">>>" if line_num == e.lineno else "   "
                    print(f"  {line_num:4d} {prefix} {line.rstrip()}")
    
    if error_count == 0:
        print(f"✓ All {len(list(Path('app').rglob('*.py')))} Python files have valid syntax")
    else:
        print(f"✗ Found {error_count} syntax errors")
    
    return error_count == 0

def check_imports():
    """Check if all imports can be resolved"""
    print("\n🔍 Checking Imports...")
    import_errors = []
    
    # First check if all local modules exist
    for py_file in Path("app").rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
        
        with open(py_file, 'r') as f:
            content = f.read()
        
        # Extract imports
        import_pattern = r'from\s+(app\.[^\s]+)\s+import|import\s+(app\.[^\s]+)'
        matches = re.findall(import_pattern, content)
        
        for match in matches:
            module_path = match[0] or match[1]
            if module_path:
                # Convert module path to file path
                file_path = module_path.replace('.', '/') + '.py'
                dir_path = module_path.replace('.', '/')
                
                if not (Path(file_path).exists() or Path(dir_path).exists()):
                    import_errors.append(f"{py_file}: Cannot find module {module_path}")
    
    # Check external imports
    required_packages = {
        'fastapi': 'FastAPI framework',
        'sqlalchemy': 'SQLAlchemy ORM',
        'pydantic': 'Pydantic validation',
        'chromadb': 'ChromaDB vector database',
        'openai': 'OpenAI API',
        'anthropic': 'Anthropic API',
        'redis': 'Redis client',
        'celery': 'Celery task queue',
        'pytest': 'Testing framework'
    }
    
    for package, description in required_packages.items():
        try:
            importlib.util.find_spec(package)
            results.successes.append(f"Package available: {package} ({description})")
        except ImportError:
            results.warnings.append(f"Package not installed locally: {package} ({description})")
    
    if import_errors:
        for error in import_errors:
            results.errors.append(error)
        print(f"✗ Found {len(import_errors)} import errors")
    else:
        print("✓ All imports are valid")
    
    return len(import_errors) == 0

def check_environment_variables():
    """Check if all required environment variables are defined"""
    print("\n🔍 Checking Environment Variables...")
    
    # Check .env file
    env_file = Path(".env")
    if not env_file.exists():
        results.errors.append(".env file not found")
        return False
    
    # Parse .env file
    env_vars = {}
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    # Required environment variables
    required_vars = [
        'DATABASE_URL',
        'ANTHROPIC_API_KEY',
        'BING_API_KEY',
        'SERP_API_KEY',
        'STRIPE_API_KEY',
        'STRIPE_WEBHOOK_SECRET'
    ]
    
    missing_vars = []
    placeholder_vars = []
    
    for var in required_vars:
        if var not in env_vars:
            missing_vars.append(var)
        elif env_vars[var] in ['your_key_here', '', 'xxx', 'TODO']:
            placeholder_vars.append(var)
        else:
            results.successes.append(f"Environment variable set: {var}")
    
    if missing_vars:
        for var in missing_vars:
            results.errors.append(f"Missing environment variable: {var}")
    
    if placeholder_vars:
        for var in placeholder_vars:
            results.warnings.append(f"Environment variable has placeholder value: {var}")
    
    if not missing_vars and not placeholder_vars:
        print("✓ All environment variables are properly set")
    else:
        print(f"✗ Found {len(missing_vars)} missing and {len(placeholder_vars)} placeholder variables")
    
    return len(missing_vars) == 0

def check_database_models():
    """Check database models for issues"""
    print("\n🔍 Checking Database Models...")
    
    models_dir = Path("app/models")
    if not models_dir.exists():
        results.errors.append("Models directory not found")
        return False
    
    issues = []
    model_count = 0
    
    for model_file in models_dir.glob("*.py"):
        if model_file.name == "__init__.py":
            continue
        
        model_count += 1
        
        with open(model_file, 'r') as f:
            content = f.read()
        
        # Check for common issues
        if "Base" not in content and model_file.name != "base.py":
            issues.append(f"{model_file.name}: No Base import found")
        
        if "Column" in content and "from sqlalchemy" not in content:
            issues.append(f"{model_file.name}: Uses Column but doesn't import from sqlalchemy")
        
        # Check for table names
        if "class" in content and "__tablename__" not in content:
            results.warnings.append(f"{model_file.name}: Model class without __tablename__")
    
    if issues:
        for issue in issues:
            results.errors.append(issue)
        print(f"✗ Found {len(issues)} model issues")
    else:
        print(f"✓ All {model_count} database models look good")
    
    return len(issues) == 0

def check_api_endpoints():
    """Check API endpoint definitions"""
    print("\n🔍 Checking API Endpoints...")
    
    api_dir = Path("app/api")
    if not api_dir.exists():
        results.errors.append("API directory not found")
        return False
    
    endpoint_count = 0
    issues = []
    
    for api_file in api_dir.glob("*.py"):
        if api_file.name in ["__init__.py", "__pycache__"]:
            continue
        
        with open(api_file, 'r') as f:
            content = f.read()
        
        # Count endpoints
        endpoint_count += len(re.findall(r'@router\.(get|post|put|delete|patch)', content))
        
        # Check for common issues
        if "router = APIRouter" in content and "prefix=" not in content:
            results.warnings.append(f"{api_file.name}: APIRouter without prefix")
        
        if "@router." in content and "async def" not in content:
            results.warnings.append(f"{api_file.name}: Has routes but no async functions")
        
        # Check for error handling
        if "HTTPException" not in content and "@router." in content:
            results.warnings.append(f"{api_file.name}: No HTTPException handling")
    
    print(f"✓ Found {endpoint_count} API endpoints")
    
    return True

def check_dependencies():
    """Check if requirements.txt matches actual imports"""
    print("\n🔍 Checking Dependencies...")
    
    req_file = Path("requirements.txt")
    if not req_file.exists():
        results.errors.append("requirements.txt not found")
        return False
    
    # Parse requirements
    with open(req_file, 'r') as f:
        requirements = set()
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Extract package name (before any version specifier)
                package = re.split(r'[<>=!]', line)[0].strip()
                requirements.add(package.lower())
    
    # Find all imports in code
    used_packages = set()
    for py_file in Path("app").rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
        
        with open(py_file, 'r') as f:
            content = f.read()
        
        # Extract imports
        imports = re.findall(r'^\s*(?:from|import)\s+(\w+)', content, re.MULTILINE)
        for imp in imports:
            if imp not in ['app', 'os', 'sys', 'json', 'datetime', 'typing', 'enum']:
                used_packages.add(imp.lower())
    
    # Common package name mappings
    package_map = {
        'sqlalchemy': 'sqlalchemy',
        'fastapi': 'fastapi',
        'pydantic': 'pydantic',
        'chromadb': 'chromadb',
        'openai': 'openai',
        'anthropic': 'anthropic',
        'redis': 'redis',
        'celery': 'celery',
        'pytest': 'pytest',
        'uvicorn': 'uvicorn',
        'cv2': 'opencv-python',
        'PIL': 'pillow',
        'sklearn': 'scikit-learn'
    }
    
    # Check for missing packages
    missing = []
    for package in used_packages:
        mapped_name = package_map.get(package, package)
        if mapped_name not in requirements and package not in requirements:
            if package not in ['app', 'os', 'sys', 'json', 'datetime', 'typing', 'enum', 're', 'math']:
                missing.append(package)
    
    if missing:
        for pkg in missing:
            results.warnings.append(f"Package used but not in requirements.txt: {pkg}")
    
    print(f"✓ Found {len(requirements)} packages in requirements.txt")
    
    return True

def check_docker_files():
    """Check Docker-related files"""
    print("\n🔍 Checking Docker Files...")
    
    # Check Dockerfile
    dockerfile = Path("Dockerfile")
    if not dockerfile.exists():
        results.errors.append("Dockerfile not found")
        return False
    
    with open(dockerfile, 'r') as f:
        dockerfile_content = f.read()
    
    # Check for common issues
    if "WORKDIR" not in dockerfile_content:
        results.warnings.append("Dockerfile: No WORKDIR set")
    
    if "requirements.txt" not in dockerfile_content:
        results.errors.append("Dockerfile: Doesn't copy requirements.txt")
    
    if "EXPOSE" not in dockerfile_content:
        results.warnings.append("Dockerfile: No port exposed")
    
    # Check docker-compose
    compose_file = Path("../docker-compose.yml")
    if compose_file.exists():
        results.successes.append("docker-compose.yml found")
        
        # Check for version warning
        with open(compose_file, 'r') as f:
            if "version:" in f.read():
                results.warnings.append("docker-compose.yml: Contains deprecated 'version' field")
    else:
        results.errors.append("docker-compose.yml not found")
    
    print("✓ Docker files checked")
    return True

def check_chromadb_settings():
    """Check ChromaDB configuration"""
    print("\n�� Checking ChromaDB Configuration...")
    
    issues = []
    
    for py_file in Path("app").rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
        
        with open(py_file, 'r') as f:
            content = f.read()
        
        if "chromadb" in content:
            # Check for telemetry settings
            if "PersistentClient" in content and "anonymized_telemetry=False" not in content:
                issues.append(f"{py_file}: ChromaDB client without telemetry disabled")
            
            # Check for proper settings import
            if "Settings" not in content and "PersistentClient" in content:
                results.warnings.append(f"{py_file}: ChromaDB client without Settings import")
    
    if issues:
        for issue in issues:
            results.errors.append(issue)
    else:
        print("✓ ChromaDB configuration looks good")
    
    return len(issues) == 0

def check_error_handling():
    """Check for proper error handling"""
    print("\n🔍 Checking Error Handling...")
    
    main_py = Path("app/main.py")
    with open(main_py, 'r') as f:
        main_content = f.read()
    
    if "@app.exception_handler" in main_content:
        results.successes.append("Global exception handler found")
    else:
        results.warnings.append("No global exception handler in main.py")
    
    # Check individual endpoints
    error_handling_count = 0
    for api_file in Path("app/api").glob("*.py"):
        if api_file.name == "__init__.py":
            continue
        
        with open(api_file, 'r') as f:
            content = f.read()
        
        if "try:" in content and "except" in content:
            error_handling_count += 1
    
    print(f"✓ Found error handling in {error_handling_count} API files")
    return True

def run_import_test():
    """Test if the app can be imported"""
    print("\n🔍 Testing App Import...")
    
    test_script = '''
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ['ANONYMIZED_TELEMETRY'] = 'false'
os.environ['TESTING'] = 'true'

try:
    from app.main import app
    print("✓ App imported successfully")
    
    # Check if all routers are included
    router_count = len(app.routes)
    print(f"✓ Found {router_count} routes")
    
except Exception as e:
    print(f"✗ Import failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
'''
    
    with open('test_import.py', 'w') as f:
        f.write(test_script)
    
    result = subprocess.run([sys.executable, 'test_import.py'], capture_output=True, text=True)
    print(result.stdout)
    
    # Cleanup
    os.remove('test_import.py')
    
    return result.returncode == 0

# Run all checks
print("=" * 60)
print("COMPREHENSIVE PRE-DOCKER BUILD TEST")
print("=" * 60)

all_passed = True

all_passed &= check_python_syntax()
all_passed &= check_imports()
all_passed &= check_environment_variables()
all_passed &= check_database_models()
all_passed &= check_api_endpoints()
all_passed &= check_dependencies()
all_passed &= check_docker_files()
all_passed &= check_chromadb_settings()
all_passed &= check_error_handling()
all_passed &= run_import_test()

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)

if results.errors:
    print(f"\n❌ ERRORS ({len(results.errors)}):")
    for error in results.errors:
        print(f"  - {error}")

if results.warnings:
    print(f"\n⚠️  WARNINGS ({len(results.warnings)}):")
    for warning in results.warnings:
        print(f"  - {warning}")

if results.successes:
    print(f"\n✅ SUCCESSES ({len(results.successes)}):")
    # Only show first 5 successes to avoid clutter
    for success in results.successes[:5]:
        print(f"  - {success}")
    if len(results.successes) > 5:
        print(f"  ... and {len(results.successes) - 5} more")

print("\n" + "=" * 60)

if all_passed and not results.errors:
    print("✅ ALL CRITICAL TESTS PASSED - Ready for Docker build!")
    exit(0)
else:
    print("❌ TESTS FAILED - Fix errors before Docker build")
    exit(1)
EOF

# Make it executable
chmod +x comprehensive_test.py

# Run the comprehensive test
print_status "header" "RUNNING COMPREHENSIVE PRE-DOCKER BUILD TESTS"

python3 comprehensive_test.py

TEST_RESULT=$?

# If tests pass, offer to build Docker
if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    print_status "success" "All tests passed! Your code is ready for Docker build."
    echo ""
    echo "Run Docker build? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "info" "Starting Docker build..."
        cd ..
        docker-compose down
        docker-compose build backend
        
        if [ $? -eq 0 ]; then
            print_status "success" "Docker build successful!"
            docker-compose up -d backend
            sleep 10
            
            print_status "info" "Testing backend health..."
            curl -s http://localhost:8000/health | python3 -m json.tool
            
            print_status "info" "Recent logs:"
            docker-compose logs --tail=20 backend
        else
            print_status "error" "Docker build failed"
        fi
    else
        print_status "info" "Skipping Docker build. Run 'docker-compose build backend' when ready."
    fi
else
    print_status "error" "Tests failed. Fix the issues above before building Docker."
    echo ""
    echo "Common fixes:"
    echo "1. Install missing packages: pip install -r requirements.txt"
    echo "2. Set environment variables in .env file"
    echo "3. Fix syntax errors in Python files"
    echo "4. Ensure all imports are correct"
    echo "5. Add missing files (models, api endpoints, etc.)"
fi

# Cleanup
rm -f comprehensive_test.py

# Final summary
echo ""
print_status "header" "FINAL SUMMARY"
echo "Issues found: $ISSUES_FOUND"
echo "Warnings found: $WARNINGS_FOUND"

if [ $ISSUES_FOUND -eq 0 ]; then
    print_status "success" "No critical issues found!"
else
    print_status "error" "$ISSUES_FOUND critical issues need to be fixed"
fi
