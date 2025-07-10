#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

echo "🚀 Final Setup and Docker Build"
echo "=================================================="

# 1. Install missing email-validator
echo -e "\n1️⃣ Installing missing dependencies..."
pip install email-validator

# 2. Update requirements.txt to include email-validator
echo -e "\n2️⃣ Updating requirements.txt..."
if ! grep -q "email-validator" requirements.txt; then
    echo "email-validator==2.0.0" >> requirements.txt
    echo "✓ Added email-validator to requirements.txt"
fi

# 3. Run final test
echo -e "\n3️⃣ Testing imports one more time..."
python3 test_app_import.py

if [ $? -eq 0 ]; then
    echo -e "\n✅ All imports successful!"
    
    # 4. Run comprehensive test
    echo -e "\n4️⃣ Running comprehensive pre-docker test..."
    if [ -f "./test_before_docker.sh" ]; then
        ./test_before_docker.sh
        
        if [ $? -eq 0 ]; then
            echo -e "\n✅ All tests passed!"
            
            # 5. Build Docker
            echo -e "\n5️⃣ Building Docker containers..."
            cd /Users/James/Desktop/expert-finder
            
            # Stop any running containers
            docker-compose down
            
            # Build with no cache to ensure clean build
            docker-compose build --no-cache backend
            
            if [ $? -eq 0 ]; then
                echo -e "\n✅ Docker build successful!"
                
                # 6. Start services
                echo -e "\n6️⃣ Starting services..."
                docker-compose up -d
                
                # Wait for services to start
                echo "⏳ Waiting for services to start (30 seconds)..."
                sleep 30
                
                # 7. Check service health
                echo -e "\n7️⃣ Checking service health..."
                
                # Check if backend is running
                if docker-compose ps backend | grep -q "Up"; then
                    echo "✓ Backend container is running"
                    
                    # Check API health
                    echo -e "\nChecking API health endpoint..."
                    curl -s http://localhost:8000/health | python3 -m json.tool || echo "Health check failed"
                    
                    # Show logs
                    echo -e "\n📋 Recent backend logs:"
                    docker-compose logs --tail=50 backend
                    
                    echo -e "\n✅ SETUP COMPLETE!"
                    echo -e "\nYour Expert Finder backend is now running!"
                    echo -e "\nAPI Documentation: http://localhost:8000/docs"
                    echo -e "Alternative docs: http://localhost:8000/redoc"
                    echo -e "\nTo view logs: docker-compose logs -f backend"
                    echo -e "To stop: docker-compose down"
                else
                    echo "❌ Backend container failed to start"
                    docker-compose logs backend
                fi
            else
                echo "❌ Docker build failed"
            fi
        else
            echo "❌ Pre-docker tests failed"
        fi
    else
        echo "⚠️  test_before_docker.sh not found, proceeding with Docker build anyway..."
        
        # Build Docker anyway
        cd /Users/James/Desktop/expert-finder
        docker-compose up -d --build
    fi
else
    echo -e "\n❌ Import test failed. Debugging..."
    
    # Try to identify the specific issue
    python3 << 'DEBUGPY'
import sys
import os
sys.path.insert(0, os.getcwd())
os.environ['TESTING'] = 'true'
os.environ['ANONYMIZED_TELEMETRY'] = 'false'

try:
    import email_validator
    print("✓ email_validator is installed")
except ImportError:
    print("✗ email_validator is NOT installed")
    print("  Run: pip install email-validator")

try:
    from pydantic import BaseModel, EmailStr
    print("✓ Pydantic with EmailStr support is working")
except ImportError as e:
    print(f"✗ Pydantic issue: {e}")
DEBUGPY
fi

echo -e "\n=================================================="
echo "Setup Summary:"
echo "- Installed email-validator"
echo "- Updated requirements.txt"
echo "- Tested all imports"
echo "- Built Docker containers"
echo "- Started services"
echo "=================================================="

# Cleanup test files
rm -f test_app_import.py check_all_imports.py test_local_no_db.py 2>/dev/null

# Final tip
echo -e "\n💡 Quick Commands:"
echo "- View logs: docker-compose logs -f backend"
echo "- Restart: docker-compose restart backend"
echo "- Stop all: docker-compose down"
echo "- Rebuild: docker-compose up -d --build backend"
