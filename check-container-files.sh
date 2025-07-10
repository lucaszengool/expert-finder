#!/bin/bash

cd /Users/James/Desktop/expert-finder

echo "🔍 Checking files in the running container..."

# Check if container is running
if docker ps | grep -q expert-finder-backend-1; then
    echo "✅ Container is running"
    
    echo -e "\n📄 Current search.py in container:"
    docker exec expert-finder-backend-1 head -30 /app/app/api/search.py
    
    echo -e "\n📄 Current matching.py in container:"
    docker exec expert-finder-backend-1 head -30 /app/app/api/matching.py
    
    echo -e "\n📄 Files in api directory:"
    docker exec expert-finder-backend-1 ls -la /app/app/api/
    
    echo -e "\n📄 Files in services directory:"
    docker exec expert-finder-backend-1 ls -la /app/app/services/
else
    echo "❌ Container is not running"
fi

echo -e "\n💡 If files are not updated in container, we need to:"
echo "1. Stop container: docker-compose stop backend"
echo "2. Remove container: docker-compose rm -f backend"
echo "3. Rebuild: docker-compose build --no-cache backend"
echo "4. Start: docker-compose up -d backend"

# Let's also check the actual error from the logs
echo -e "\n📋 Recent errors from logs:"
docker-compose logs backend 2>&1 | grep -A10 "500 Internal Server Error" | tail -50
