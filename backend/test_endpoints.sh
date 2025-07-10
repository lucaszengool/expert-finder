#!/bin/bash

echo "🧪 Testing backend endpoints..."

# Test health
echo -e "\n📍 Testing health endpoint:"
curl -s http://localhost:8000/api/test/health | jq .

# Test ChromaDB
echo -e "\n📍 Testing ChromaDB:"
curl -s http://localhost:8000/api/test/chromadb-test | jq .

# Test database
echo -e "\n📍 Testing database:"
curl -s http://localhost:8000/api/test/database-test | jq .

# Test echo
echo -e "\n📍 Testing echo endpoint:"
curl -s -X POST http://localhost:8000/api/test/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from test"}' | jq .

# Test search (will likely fail but show error)
echo -e "\n📍 Testing search endpoint:"
curl -s -X POST http://localhost:8000/api/search/ \
  -H "Content-Type: application/json" \
  -d '{"query": "AI expert", "limit": 5}' | jq .

# Show recent logs
echo -e "\n📋 Recent backend logs:"
docker-compose logs --tail=30 backend
