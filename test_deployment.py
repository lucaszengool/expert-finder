#!/usr/bin/env python3
"""
Test script to verify Railway deployment readiness
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test all critical imports"""
    print("🧪 Testing imports...")
    
    try:
        from app.main import app
        print("✅ FastAPI app import successful")
    except Exception as e:
        print(f"❌ FastAPI app import failed: {e}")
        return False
    
    try:
        from app.utils.database import init_db
        print("✅ Database utils import successful")
    except Exception as e:
        print(f"❌ Database utils import failed: {e}")
        return False
    
    try:
        from app.api import experts, search, marketplace, matching, test_debug, email
        print("✅ Core API modules import successful")
    except Exception as e:
        print(f"❌ Core API modules import failed: {e}")
        return False
    
    try:
        from app.routers import clerk_webhook
        print("✅ Clerk webhook import successful")
    except Exception as e:
        print(f"❌ Clerk webhook import failed: {e}")
        return False
    
    return True

def test_dependencies():
    """Test critical dependencies"""
    print("\n📦 Testing dependencies...")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'openai',
        'anthropic',
        'requests',
        'pydantic'
    ]
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} available")
        except ImportError:
            print(f"❌ {package} missing")
            return False
    
    return True

def test_app_startup():
    """Test app can start"""
    print("\n🚀 Testing app startup...")
    
    try:
        from app.main import app
        # Test that the app can be created
        assert app is not None
        print("✅ App created successfully")
        
        # Test root endpoint exists
        for route in app.routes:
            if hasattr(route, 'path') and route.path == '/':
                print("✅ Root endpoint configured")
                break
        else:
            print("❌ Root endpoint not found")
            return False
            
        return True
    except Exception as e:
        print(f"❌ App startup test failed: {e}")
        return False

def main():
    print("🔍 Railway Deployment Readiness Test")
    print("="*50)
    
    all_passed = True
    
    # Run tests
    all_passed &= test_dependencies()
    all_passed &= test_imports()
    all_passed &= test_app_startup()
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 All tests passed! Ready for Railway deployment")
        return 0
    else:
        print("❌ Some tests failed. Check issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())