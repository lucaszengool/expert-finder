#!/usr/bin/env python3
"""
Debug and fix Docker backend issues
"""
import os
import sys
import json
import yaml
import subprocess
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_status(status, message):
    if status == "success":
        print(f"{Colors.GREEN}✓{Colors.ENDC} {message}")
    elif status == "error":
        print(f"{Colors.RED}✗{Colors.ENDC} {message}")
    elif status == "warning":
        print(f"{Colors.YELLOW}⚠{Colors.ENDC} {message}")
    elif status == "info":
        print(f"{Colors.BLUE}ℹ{Colors.ENDC} {message}")

def fix_docker_compose():
    """Remove version attribute from docker-compose.yml"""
    print_status("info", "Fixing docker-compose.yml...")
    
    compose_path = Path("../docker-compose.yml")
    if compose_path.exists():
        with open(compose_path, 'r') as f:
            compose_data = yaml.safe_load(f)
        
        # Remove version if exists
        if 'version' in compose_data:
            del compose_data['version']
            
            with open(compose_path, 'w') as f:
                yaml.dump(compose_data, f, default_flow_style=False)
            
            print_status("success", "Removed 'version' from docker-compose.yml")
        else:
            print_status("info", "docker-compose.yml already fixed")

def fix_telemetry_issue():
    """Fix ChromaDB telemetry issue"""
    print_status("info", "Fixing telemetry issue...")
    
    # Add environment variable to disable telemetry
    env_file = Path(".env")
    env_content = ""
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            env_content = f.read()
    
    if "ANONYMIZED_TELEMETRY" not in env_content:
        with open(env_file, 'a') as f:
            f.write("\n# Disable ChromaDB telemetry\n")
            f.write("ANONYMIZED_TELEMETRY=false\n")
        print_status("success", "Added telemetry disable flag to .env")
    
    # Also add to docker-compose
    compose_path = Path("../docker-compose.yml")
    if compose_path.exists():
        with open(compose_path, 'r') as f:
            compose_data = yaml.safe_load(f)
        
        if 'services' in compose_data and 'backend' in compose_data['services']:
            if 'environment' not in compose_data['services']['backend']:
                compose_data['services']['backend']['environment'] = []
            
            env_list = compose_data['services']['backend']['environment']
            if not any("ANONYMIZED_TELEMETRY" in str(e) for e in env_list):
                env_list.append("ANONYMIZED_TELEMETRY=false")
                
                with open(compose_path, 'w') as f:
                    yaml.dump(compose_data, f, default_flow_style=False)
                
                print_status("success", "Added telemetry disable to docker-compose.yml")

def add_error_logging():
    """Add better error logging to main.py"""
    print_status("info", "Adding error logging to API...")
    
    main_py = Path("app/main.py")
    if main_py.exists():
        with open(main_py, 'r') as f:
            content = f.read()
        
        # Check if error handler exists
        if "@app.exception_handler" not in content:
            # Add error handler
            error_handler = '''
# Add exception handler for better error logging
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to log all errors"""
    error_id = str(uuid.uuid4())[:8]
    
    # Log the full error
    print(f"\\n{'='*60}")
    print(f"ERROR ID: {error_id}")
    print(f"Endpoint: {request.method} {request.url.path}")
    print(f"Error Type: {type(exc).__name__}")
    print(f"Error Message: {str(exc)}")
    print(f"\\nFull Traceback:")
    traceback.print_exc()
    print(f"{'='*60}\\n")
    
    # Return user-friendly error
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "error_id": error_id,
            "message": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "An error occurred",
            "type": type(exc).__name__
        }
    )
'''
            
            # Find where to insert (after imports, before routes)
            lines = content.split('\n')
            insert_idx = 0
            
            for i, line in enumerate(lines):
                if line.strip().startswith("app = FastAPI"):
                    insert_idx = i + 5  # A few lines after app creation
                    break
            
            # Insert the error handler
            lines.insert(insert_idx, error_handler)
            
            # Add import if needed
            if "import traceback" not in content:
                for i, line in enumerate(lines):
                    if line.startswith("import") or line.startswith("from"):
                        continue
                    else:
                        lines.insert(i-1, "import traceback")
                        lines.insert(i, "import uuid")
                        break
            
            with open(main_py, 'w') as f:
                f.write('\n'.join(lines))
            
            print_status("success", "Added global error handler")

def check_chromadb_init():
    """Fix ChromaDB initialization issues"""
    print_status("info", "Checking ChromaDB initialization...")
    
    # Find all files using ChromaDB
    for py_file in Path("app").rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue
            
        with open(py_file, 'r') as f:
            content = f.read()
        
        if "chromadb" in content:
            # Check for telemetry issue
            if "PersistentClient" in content and "settings=" not in content:
                print_status("warning", f"Found ChromaDB without settings in {py_file}")
                
                # Fix it
                fixed_content = content.replace(
                    "chromadb.PersistentClient(",
                    "chromadb.PersistentClient(settings=chromadb.Settings(anonymized_telemetry=False), "
                )
                
                # Also add import if needed
                if "from chromadb import Settings" not in fixed_content and "import chromadb.Settings" not in fixed_content:
                    if "import chromadb" in fixed_content:
                        fixed_content = fixed_content.replace(
                            "import chromadb",
                            "import chromadb\nfrom chromadb import Settings"
                        )
                
                if fixed_content != content:
                    with open(py_file, 'w') as f:
                        f.write(fixed_content)
                    print_status("success", f"Fixed ChromaDB in {py_file}")

def create_test_endpoints():
    """Create test endpoints to debug issues"""
    print_status("info", "Creating test endpoints...")
    
    test_file = Path("app/api/test_debug.py")
    test_file.parent.mkdir(exist_ok=True)
    
    with open(test_file, 'w') as f:
        f.write('''
from fastapi import APIRouter
import os
import sys
import chromadb
from datetime import datetime

router = APIRouter(prefix="/api/test", tags=["test"])

@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "environment": os.getenv("ENVIRONMENT", "unknown")
    }

@router.get("/chromadb-test")
async def test_chromadb():
    """Test ChromaDB connection"""
    try:
        # Test ChromaDB with telemetry disabled
        client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=chromadb.Settings(anonymized_telemetry=False)
        )
        
        collections = client.list_collections()
        
        return {
            "status": "success",
            "collections": [col.name for col in collections],
            "path": "./chroma_db"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }

@router.get("/database-test")
async def test_database():
    """Test database connection"""
    try:
        from app.database import SessionLocal
        
        db = SessionLocal()
        result = db.execute("SELECT 1").scalar()
        db.close()
        
        return {
            "status": "success",
            "result": result,
            "database_url": os.getenv("DATABASE_URL", "not set")[:30] + "..."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }

@router.post("/echo")
async def echo_test(data: dict):
    """Echo endpoint for testing"""
    return {
        "received": data,
        "timestamp": datetime.now().isoformat()
    }
''')
    
    # Add to main.py
    main_py = Path("app/main.py")
    with open(main_py, 'r') as f:
        content = f.read()
    
    if "test_debug" not in content:
        # Add import
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if "from app.api" in line:
                lines.insert(i+1, "from app.api import test_debug")
                break
        
        # Add router
        for i, line in enumerate(lines):
            if "app.include_router" in line:
                lines.insert(i+1, "app.include_router(test_debug.router)")
                break
        
        with open(main_py, 'w') as f:
            f.write('\n'.join(lines))
        
        print_status("success", "Added test endpoints")

def test_backend_locally():
    """Test backend without Docker"""
    print_status("info", "Testing backend locally...")
    
    # Create test script
    with open("test_local.py", 'w') as f:
        f.write('''
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set test environment
os.environ['TESTING'] = 'true'
os.environ['ANONYMIZED_TELEMETRY'] = 'false'

try:
    from app.main import app
    print("✓ App imported successfully")
    
    # Test basic functionality
    from app.api.search import router as search_router
    print("✓ Search router imported")
    
    from app.api.matching import router as matching_router  
    print("✓ Matching router imported")
    
    print("\\n✓ All imports successful!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
''')
    
    result = subprocess.run([sys.executable, "test_local.py"], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    
    os.remove("test_local.py")
    
    return result.returncode == 0

def rebuild_docker():
    """Rebuild Docker with fixes"""
    print_status("info", "Rebuilding Docker...")
    
    os.chdir("..")
    
    # Stop existing containers
    subprocess.run(["docker-compose", "down"], capture_output=True)
    
    # Remove old images
    subprocess.run(["docker-compose", "rm", "-f"], capture_output=True)
    
    # Rebuild
    result = subprocess.run(["docker-compose", "build", "--no-cache", "backend"], capture_output=True, text=True)
    
    if result.returncode == 0:
        print_status("success", "Docker rebuilt successfully")
        
        # Start container
        result = subprocess.run(["docker-compose", "up", "-d", "backend"], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_status("success", "Backend started")
            
            # Show logs
            print_status("info", "Recent logs:")
            subprocess.run(["docker-compose", "logs", "--tail=20", "backend"])
        else:
            print_status("error", "Failed to start backend")
            print(result.stderr)
    else:
        print_status("error", "Build failed")
        print(result.stderr)

if __name__ == "__main__":
    print(f"{Colors.BOLD}Docker Backend Debug and Fix{Colors.ENDC}")
    print("=" * 60)
    
    # Run all fixes
    fix_docker_compose()
    fix_telemetry_issue()
    add_error_logging()
    check_chromadb_init()
    create_test_endpoints()
    
    # Test locally first
    print(f"\n{Colors.BOLD}Testing locally...{Colors.ENDC}")
    if test_backend_locally():
        print_status("success", "Local tests passed")
        
        # Rebuild Docker
        print(f"\n{Colors.BOLD}Rebuilding Docker...{Colors.ENDC}")
        rebuild_docker()
    else:
        print_status("error", "Local tests failed - fix issues before Docker build")
