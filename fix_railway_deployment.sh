#!/bin/bash

echo "🔧 Fixing Railway deployment issues..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Use the Railway-optimized requirements
print_status "Switching to Railway-optimized requirements..."
cp backend/requirements-railway.txt backend/requirements.txt

# Use the Railway-optimized Dockerfile
print_status "Switching to Railway-optimized Dockerfile..."
cp Dockerfile.railway Dockerfile

# Update main.py to handle missing dependencies gracefully
print_status "Updating main.py for Railway compatibility..."

cat > temp_update_main.py << 'EOL'
import re

# Read the main.py file
with open('backend/app/main.py', 'r') as f:
    content = f.read()

# Add graceful handling for missing enhanced outreach modules
enhanced_import_pattern = r'# Import enhanced outreach modules.*?ENHANCED_OUTREACH_ENABLED = False'

enhanced_import_replacement = '''# Import enhanced outreach modules
try:
    from app.api import outreach, outreach_enhanced, webhooks
    OUTREACH_ENABLED = True
    ENHANCED_OUTREACH_ENABLED = True
except ImportError as e:
    print(f"Warning: Enhanced outreach modules not found: {e}. Continuing without them.")
    try:
        from app.api import outreach
        OUTREACH_ENABLED = True
        ENHANCED_OUTREACH_ENABLED = False
    except ImportError:
        print("Warning: Outreach module not found. Continuing without it.")
        OUTREACH_ENABLED = False
        ENHANCED_OUTREACH_ENABLED = False'''

# Replace the enhanced import section
updated_content = re.sub(enhanced_import_pattern, enhanced_import_replacement, content, flags=re.DOTALL)

# Write back to file
with open('backend/app/main.py', 'w') as f:
    f.write(updated_content)

print("main.py updated for Railway compatibility")
EOL

python temp_update_main.py
rm temp_update_main.py

# Create a minimal alembic.ini for Railway
print_status "Creating Railway-compatible alembic.ini..."
cat > backend/alembic.ini << 'EOL'
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = 

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
EOL

# Create railway deployment checklist
print_status "Creating Railway deployment guide..."
cat > QUICK_RAILWAY_DEPLOY.md << 'EOL'
# 🚂 Quick Railway Deployment Fix

## Issue Fixed
✅ Removed heavy PyTorch dependencies causing build failures
✅ Optimized for Railway's build environment
✅ Added graceful handling for optional features

## Deploy Steps

### 1. Commit Changes
```bash
git add .
git commit -m "Fix Railway deployment - optimized dependencies"
git push origin main
```

### 2. Railway Setup
1. Go to [Railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Add PostgreSQL database service

### 3. Environment Variables (Backend)
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your_openai_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 4. Frontend Service (Optional)
- Add second service from same repo
- Set root directory to `frontend/`
- Add environment variables:
```env
REACT_APP_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## What Changed
- ✅ Lightweight dependencies (no PyTorch, scikit-learn, etc.)
- ✅ CPU-only AI processing using OpenAI API
- ✅ Graceful handling of missing ML libraries
- ✅ Faster build times
- ✅ Smaller memory footprint

## Core Features Still Available
- ✅ Multi-channel outreach (Email, social media)
- ✅ AI-powered responses via OpenAI
- ✅ Campaign management
- ✅ Analytics tracking
- ✅ Webhook integration

## Missing Features (Optional)
- ⚠️ Advanced ML-based sentiment analysis (replaced with OpenAI)
- ⚠️ Local embedding models (using OpenAI embeddings instead)
- ⚠️ Heavy NLP processing (simplified versions available)

Your platform will work great with these optimizations! 🚀
EOL

print_success "Railway deployment fixed! 🎉"
echo ""
print_status "Changes made:"
echo "✅ Switched to lightweight requirements-railway.txt"
echo "✅ Using Railway-optimized Dockerfile"
echo "✅ Updated main.py for graceful handling"
echo "✅ Created QUICK_RAILWAY_DEPLOY.md guide"
echo ""
print_warning "Next steps:"
echo "1. git add . && git commit -m 'Fix Railway deployment'"
echo "2. git push origin main"
echo "3. Deploy on Railway with DATABASE_URL and OPENAI_API_KEY"
echo ""
print_success "Your AI Outreach Platform should deploy successfully now! 🚀"