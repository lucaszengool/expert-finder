#!/bin/bash

cd /Users/James/Desktop/expert-finder/backend

# First, let's check and fix the syntax error in main.py
echo "🔧 Fixing syntax error in main.py..."

cat > fix_main_syntax.py << 'EOF'
#!/usr/bin/env python3
import re

# Read main.py
with open('app/main.py', 'r') as f:
    content = f.read()

# Check for the syntax error - likely duplicate or misplaced import
lines = content.split('\n')

# Find and fix the issue
fixed_lines = []
seen_imports = set()
in_error_handler = False

for i, line in enumerate(lines):
    # Skip duplicate imports
    if line.strip().startswith(('import ', 'from ')) and line.strip() in seen_imports:
        print(f"Removing duplicate: {line.strip()}")
        continue
    
    if line.strip().startswith(('import ', 'from ')):
        seen_imports.add(line.strip())
    
    # Check for orphaned imports (imports not at the top)
    if i > 50 and line.strip() == "from fastapi import Request":
        print(f"Found orphaned import at line {i+1}, removing it")
        continue
    
    fixed_lines.append(line)

# Write back
with open('app/main.py', 'w') as f:
    f.write('\n'.join(fixed_lines))

print("✓ Fixed main.py syntax")
EOF

python3 fix_main_syntax.py

# Let's also check the main.py structure
echo -e "\n📋 Checking main.py structure..."
head -30 app/main.py

# Fix Docker connection issue - try different registry or add retry
echo -e "\n🔧 Fixing Docker registry issue..."

# Update Dockerfile to use a more reliable base image
cat > Dockerfile << 'EOF'
# Use official Python runtime as base image
FROM python:3.11

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p chroma_db logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ANONYMIZED_TELEMETRY=false

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/test/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF

# Create a simplified test to verify syntax
echo -e "\n�� Testing Python syntax..."
python3 -m py_compile app/main.py
if [ $? -eq 0 ]; then
    echo "✓ Python syntax is valid"
else
    echo "✗ Python syntax error remains"
    # Show the error
    python3 -c "import app.main" 2>&1 | head -20
fi

# Create environment file if missing keys
echo -e "\n🔧 Checking environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'ENVEOF'
# Database
DATABASE_URL=postgresql://expertuser:expertpass@db:5432/expertdb

# ChromaDB
ANONYMIZED_TELEMETRY=false

# API Keys (add your actual keys)
ANTHROPIC_API_KEY=your_key_here
BING_API_KEY=your_key_here
SERP_API_KEY=your_key_here
STRIPE_API_KEY=your_key_here
STRIPE_WEBHOOK_SECRET=your_key_here

# App settings
DEBUG=true
ENVIRONMENT=development
ENVEOF
    echo "✓ Created .env file (add your API keys)"
fi

# Try Docker build with retry logic
echo -e "\n🐳 Building Docker with retry logic..."

# Function to retry Docker build
retry_docker_build() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Build attempt $attempt of $max_attempts..."
        
        # Try to pull base image first
        docker pull python:3.11
        
        # Build
        cd ..
        docker-compose build --no-cache backend
        
        if [ $? -eq 0 ]; then
            echo "✓ Build successful!"
            return 0
        else
            echo "✗ Build failed on attempt $attempt"
            
            if [ $attempt -lt $max_attempts ]; then
                echo "Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Clean up first
echo "🧹 Cleaning up old containers..."
cd ..
docker-compose down
docker system prune -f

# Try to build
retry_docker_build

if [ $? -eq 0 ]; then
    echo -e "\n🚀 Starting backend..."
    docker-compose up -d backend
    
    # Wait for startup
    echo "⏳ Waiting for backend to start..."
    sleep 10
    
    # Check logs
    echo -e "\n📋 Backend logs:"
    docker-compose logs --tail=30 backend
    
    # Test health endpoint
    echo -e "\n🧪 Testing health endpoint..."
    curl -s http://localhost:8000/api/test/health | python3 -m json.tool || echo "Health check failed"
else
    echo -e "\n❌ Docker build failed after all attempts"
    echo "Try these solutions:"
    echo "1. Check your internet connection"
    echo "2. Restart Docker Desktop"
    echo "3. Try: docker system prune -a"
    echo "4. Use a VPN if in a restricted region"
fi
EOF

chmod +x fix_syntax_docker.sh

# Also create a manual syntax checker
cat > check_syntax.py << 'EOF'
#!/usr/bin/env python3
import ast
import sys
from pathlib import Path

def check_file(filepath):
    """Check Python file syntax"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Try to parse
        ast.parse(content)
        print(f"✓ {filepath} - Syntax OK")
        return True
    except SyntaxError as e:
        print(f"✗ {filepath} - Syntax Error:")
        print(f"  Line {e.lineno}: {e.msg}")
        print(f"  Text: {e.text.strip() if e.text else 'N/A'}")
        
        # Show context
        with open(filepath, 'r') as f:
            lines = f.readlines()
        
        start = max(0, e.lineno - 3)
        end = min(len(lines), e.lineno + 2)
        
        print("\n  Context:")
        for i in range(start, end):
            prefix = ">>> " if i == e.lineno - 1 else "    "
            print(f"  {i+1:4d}{prefix}{lines[i].rstrip()}")
        
        return False

# Check all Python files
print("Checking Python syntax in all files...\n")
all_good = True

for py_file in Path("app").rglob("*.py"):
    if "__pycache__" not in str(py_file):
        if not check_file(py_file):
            all_good = False
            print()

if all_good:
    print("\n✓ All files have valid syntax!")
else:
    print("\n✗ Fix syntax errors before proceeding")
    sys.exit(1)
EOF

chmod +x check_syntax.py

# Run the syntax checker first
echo "🔍 Checking all Python files for syntax errors..."
./check_syntax.py

# If syntax is OK, run the fix script
if [ $? -eq 0 ]; then
    ./fix_syntax_docker.sh
else
    echo -e "\n❌ Fix syntax errors first, then run: ./fix_syntax_docker.sh"
fi
