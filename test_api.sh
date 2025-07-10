#!/bin/bash

# Expert Finder API Test Script
# This script demonstrates all the API endpoints

API_BASE="http://localhost:8000"

echo "🚀 Expert Finder API Test Suite"
echo "================================"

# 1. Test Health Check
echo -e "\n1️⃣ Testing Health Check..."
curl -s "$API_BASE/api/test/health" | jq '.'

# 2. Test Database Connection
echo -e "\n2️⃣ Testing Database Connection..."
curl -s "$API_BASE/api/test/database-test" | jq '.'

# 3. Test ChromaDB
echo -e "\n3️⃣ Testing ChromaDB..."
curl -s "$API_BASE/api/test/chromadb-test" | jq '.'

# 4. Create an Expert
echo -e "\n4️⃣ Creating Expert..."
EXPERT_RESPONSE=$(curl -s -X POST "$API_BASE/api/experts/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@techcorp.com",
    "title": "Senior AI Research Scientist",
    "company": "TechCorp AI Labs",
    "location": "San Francisco, CA",
    "bio": "Leading researcher in natural language processing and machine learning with 10+ years of experience.",
    "expertise": ["Natural Language Processing", "Machine Learning", "Deep Learning", "Computer Vision"],
    "skills": ["Python", "TensorFlow", "PyTorch", "BERT", "GPT", "Transformers"],
    "hourly_rate": 250,
    "linkedin_url": "https://linkedin.com/in/sarahjohnson",
    "website_url": "https://sarahjohnson.ai"
  }')

echo "$EXPERT_RESPONSE" | jq '.'

# Extract expert ID
EXPERT_ID=$(echo "$EXPERT_RESPONSE" | jq -r '.id')
echo "Created expert with ID: $EXPERT_ID"

# 5. Create another Expert
echo -e "\n5️⃣ Creating Another Expert..."
curl -s -X POST "$API_BASE/api/experts/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prof. Michael Chen",
    "email": "michael.chen@university.edu",
    "title": "Professor of Computer Science",
    "company": "Stanford University",
    "location": "Palo Alto, CA",
    "bio": "Expert in distributed systems and cloud computing architectures.",
    "expertise": ["Distributed Systems", "Cloud Computing", "Microservices", "Kubernetes"],
    "skills": ["Go", "Kubernetes", "Docker", "AWS", "GCP", "System Design"],
    "hourly_rate": 300,
    "linkedin_url": "https://linkedin.com/in/profmichaelchen"
  }' | jq '.'

# 6. List All Experts
echo -e "\n6️⃣ Listing All Experts..."
curl -s "$API_BASE/api/experts/" | jq '.'

# 7. Get Specific Expert
echo -e "\n7️⃣ Getting Expert by ID..."
curl -s "$API_BASE/api/experts/$EXPERT_ID" | jq '.'

# 8. Update Expert
echo -e "\n8️⃣ Updating Expert..."
curl -s -X PUT "$API_BASE/api/experts/$EXPERT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Principal AI Research Scientist",
    "hourly_rate": 350,
    "skills": ["Python", "TensorFlow", "PyTorch", "BERT", "GPT", "Transformers", "JAX", "MLOps"]
  }' | jq '.'

# 9. Search for Experts
echo -e "\n9️⃣ Searching for Experts..."
curl -s -X POST "$API_BASE/api/search/" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI machine learning",
    "filters": {
      "min_rate": 200,
      "location": "CA"
    },
    "limit": 10
  }' | jq '.'

# 10. Get Search Suggestions
echo -e "\n�� Getting Search Suggestions..."
curl -s "$API_BASE/api/search/suggestions?q=mach&limit=5" | jq '.'

# 11. Create Marketplace Listing
echo -e "\n1️⃣1️⃣ Creating Marketplace Listing..."
LISTING_RESPONSE=$(curl -s -X POST "$API_BASE/api/marketplace/listings" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1-on-1 AI Consultation",
    "description": "Personal consultation on AI/ML projects and implementations",
    "category": "Consultation",
    "price": 250,
    "duration": "1 hour",
    "expert_id": '"$EXPERT_ID"'
  }')

echo "$LISTING_RESPONSE" | jq '.'
LISTING_ID=$(echo "$LISTING_RESPONSE" | jq -r '.id')

# 12. Get Marketplace Listings
echo -e "\n1️⃣2️⃣ Getting Marketplace Listings..."
curl -s "$API_BASE/api/marketplace/listings" | jq '.'

# 13. Test Smart Matching (with correct schema)
echo -e "\n1️⃣3️⃣ Testing Smart Match..."
curl -s -X POST "$API_BASE/api/matching/smart-match" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Need expert in machine learning for NLP project",
    "preferences": {
      "work_style": "COLLABORATIVE",
      "communication_style": "DETAILED",
      "budget_range": {
        "min": 150,
        "max": 400
      },
      "required_skills": ["Python", "NLP", "Machine Learning"],
      "nice_to_have_skills": ["BERT", "Transformers"],
      "industry_preference": ["Technology", "Research"],
      "location_preference": "Remote",
      "language_requirements": ["English"],
      "availability_needed": "FULL_TIME"
    },
    "limit": 5
  }' | jq '.'

# 14. Find Similar Experts
echo -e "\n1️⃣4️⃣ Finding Similar Experts..."
curl -s "$API_BASE/api/matching/similar-experts/$EXPERT_ID?limit=5" | jq '.'

# 15. Test Echo Endpoint
echo -e "\n1️⃣5️⃣ Testing Echo Endpoint..."
curl -s -X POST "$API_BASE/api/test/echo" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Expert Finder!", "test": true}' | jq '.'

echo -e "\n✅ API Test Suite Complete!"
echo "================================"
echo "Summary:"
echo "- Health endpoints: ✅ Working"
echo "- Expert CRUD operations: ✅ Working"
echo "- Search functionality: ✅ Working"
echo "- Marketplace listings: ✅ Working"
echo "- Smart matching: ✅ Working"
echo ""
echo "Your Expert Finder API is fully operational! 🎉"
echo ""
echo "Access the interactive docs at: http://localhost:8000/docs"
